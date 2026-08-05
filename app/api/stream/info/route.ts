import type { NextRequest } from "next/server";
import { requireApiBase } from "@/lib/tidal";

const DEFAULT_QUALITY = "HI_RES_LOSSLESS";

function isMpd(xml: string): boolean {
  return /<\s*[Mm][Pp][Dd]\b/.test(xml);
}

async function probeTrackv2(id: string): Promise<{ url?: string; quality?: string } | null> {
  try {
    const res = await fetch(`${requireApiBase()}/trackv2/?id=${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { url?: string; quality?: string } };
    return body.data ?? null;
  } catch {
    return null;
  }
}

async function probeTrack(
  id: string,
  quality: string,
  immersive: boolean
): Promise<{ kind: "dash"; manifest: string } | { kind: "direct"; url: string } | null> {
  try {
    const res = await fetch(
      `${requireApiBase()}/track/?id=${id}&quality=${quality}&immersiveaudio=${immersive}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { manifest?: string } };
    if (!body.data?.manifest) return null;
    const decoded = Buffer.from(body.data.manifest, "base64").toString("utf-8");
    if (isMpd(decoded)) {
      return {
        kind: "dash",
        manifest: `/api/stream/manifest?id=${id}&quality=${quality}&immersiveaudio=${immersive}`,
      };
    }
    try {
      const parsed = JSON.parse(decoded) as { urls?: string[] };
      const url = parsed.urls?.[0];
      if (url)
        return {
          kind: "direct",
          url: `/api/stream?id=${id}&src=track&quality=${quality}&immersiveaudio=${immersive}`,
        };
    } catch {
      /* not a JSON payload */
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return new Response("missing id", { status: 400 });
  const atmos = req.nextUrl.searchParams.get("atmos") === "1";

  const direct = await probeTrackv2(id);
  if (direct?.url) {
    return Response.json({
      mode: "direct",
      url: `/api/stream?id=${id}`,
      quality: direct.quality ?? DEFAULT_QUALITY,
      atmos: false,
    });
  }

  if (atmos) {
    const immersive = await probeTrack(id, DEFAULT_QUALITY, true);
    if (immersive?.kind === "direct") {
      return Response.json({
        mode: "direct",
        url: immersive.url,
        quality: DEFAULT_QUALITY,
        atmos: true,
      });
    }
    if (immersive?.kind === "dash") {
      return Response.json({
        mode: "dash",
        manifest: immersive.manifest,
        quality: DEFAULT_QUALITY,
        atmos: true,
      });
    }
  }

  const track = await probeTrack(id, DEFAULT_QUALITY, false);
  if (track?.kind === "direct") {
    return Response.json({ mode: "direct", url: track.url, quality: DEFAULT_QUALITY, atmos: false });
  }
  if (track?.kind === "dash") {
    return Response.json({ mode: "dash", manifest: track.manifest, quality: DEFAULT_QUALITY, atmos: false });
  }

  return new Response("no playback source", { status: 502 });
}
