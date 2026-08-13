import type { NextRequest } from "next/server";
import { requireApiBase } from "@/lib/tidal";

const PROBE_TIMEOUT = 15000;

function rewriteUrl(url: string): string {
  const masked = url
    .replace(/&amp;/g, "&")
    .replace(/\$Number\$/g, "__NUMBER__")
    .replace(/\$Time\$/g, "__TIME__");
  const encoded = encodeURIComponent(masked);
  return (
    "/api/segment?url=" +
    encoded.replace(/__NUMBER__/g, "$Number$").replace(/__TIME__/g, "$Time$")
  );
}

function rewriteManifest(xml: string): string {
  return xml.replace(
    /(initialization|media|url|BaseURL)="(https:[^"]*)"/g,
    (_match, attr: string, url: string) => `${attr}="${rewriteUrl(url)}"`
  );
}

async function resolveManifest(id: string, quality: string, atmos: boolean): Promise<string | null> {
  try {
    if (atmos) {
      const tmRes = await fetch(`${requireApiBase()}/trackManifests/?id=${id}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(PROBE_TIMEOUT),
      });
      if (!tmRes.ok) return null;
      const tm = (await tmRes.json()) as {
        data?: { data?: { attributes?: { uri?: string } } };
      };
      const uri = tm.data?.data?.attributes?.uri;
      if (!uri) return null;
      const mpdRes = await fetch(uri, {
        cache: "no-store",
        signal: AbortSignal.timeout(PROBE_TIMEOUT),
      });
      if (!mpdRes.ok) return null;
      const xml = await mpdRes.text();
      if (!/<\s*[Mm][Pp][Dd]\b/.test(xml)) return null;
      return rewriteManifest(xml);
    }

    const res = await fetch(
      `${requireApiBase()}/track/?id=${id}&quality=${quality}`,
      { cache: "no-store", signal: AbortSignal.timeout(PROBE_TIMEOUT) }
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { manifest?: string } };
    const b64 = body.data?.manifest;
    if (!b64) return null;

    const xml = Buffer.from(b64, "base64").toString("utf-8");
    if (!/<\s*[Mm][Pp][Dd]\b/.test(xml)) return null;
    return rewriteManifest(xml);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const quality = req.nextUrl.searchParams.get("quality") ?? "HI_RES_LOSSLESS";
  const atmos = req.nextUrl.searchParams.get("atmos") === "1";
  if (!id) return new Response("missing id", { status: 400 });

  const xml = await resolveManifest(id, quality, atmos);
  if (!xml) {
    return new Response("manifest unavailable", { status: 502 });
  }

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/dash+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
