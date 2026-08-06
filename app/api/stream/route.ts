import type { NextRequest } from "next/server";
import { requireApiBase } from "@/lib/tidal";

const PROBE_TIMEOUT = 15000;

async function resolveTrackUrl(id: string, quality: string, immersive: boolean): Promise<string | null> {
  try {
    const res = await fetch(
      `${requireApiBase()}/track/?id=${id}&quality=${quality}&immersiveaudio=${immersive}`,
      { cache: "no-store", signal: AbortSignal.timeout(PROBE_TIMEOUT) }
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { manifest?: string } };
    if (!body.data?.manifest) return null;
    const decoded = Buffer.from(body.data.manifest, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded) as { urls?: string[] };
    return parsed.urls?.[0] ?? null;
  } catch {
    return null;
  }
}

async function resolveStreamUrl(id: string, src: string, quality: string, immersive: boolean): Promise<string | null> {
  if (src === "track") {
    return resolveTrackUrl(id, quality, immersive);
  }
  try {
    const res = await fetch(`${requireApiBase()}/trackv2/?id=${id}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { url?: string } };
    return body.data?.url ?? null;
  } catch {
    return null;
  }
}

const FORWARDED_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "cache-control",
  "etag",
  "last-modified",
];

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return new Response("missing id", { status: 400 });
  }
  const src = req.nextUrl.searchParams.get("src") ?? "direct";
  const quality = req.nextUrl.searchParams.get("quality") ?? "HI_RES_LOSSLESS";
  const immersive = req.nextUrl.searchParams.get("immersiveaudio") !== "false";

  const streamUrl = await resolveStreamUrl(id, src, quality, immersive);
  if (!streamUrl) {
    return new Response("stream unavailable", { status: 502 });
  }

  const headers = new Headers();
  const range = req.headers.get("range");
  if (range) headers.set("range", range);

  let upstream: Response;
  try {
    upstream = await fetch(streamUrl, { headers, cache: "no-store" });
  } catch {
    return new Response("upstream error", { status: 502 });
  }

  const responseHeaders = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
