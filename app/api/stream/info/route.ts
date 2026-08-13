import type { NextRequest } from "next/server";
import { requireApiBase } from "@/lib/tidal";

const DEFAULT_QUALITY = "HI_RES_LOSSLESS";
const PROBE_TIMEOUT = 15000;

interface ProviderPayload {
  trackv2?: unknown;
  track?: unknown;
  trackManifests?: unknown;
}

function json(body: unknown): Response {
  return Response.json(body, { headers: { "cache-control": "no-store" } });
}

function isMpd(xml: string): boolean {
  return /<\s*[Mm][Pp][Dd]\b/.test(xml);
}

function manifestIsAtmos(xml: string): boolean {
  return /EAC3[_-]?JOC|codecs=["']ec-3["']|IMMERSIVE/i.test(xml);
}

async function detectAtmos(id: string, provider: ProviderPayload): Promise<boolean> {
  try {
    const res = await fetch(`${requireApiBase()}/trackManifests/?id=${id}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as {
      data?: { data?: { attributes?: { formats?: string[] } } };
    };
    provider.trackManifests = body;
    const formats = body.data?.data?.attributes?.formats ?? [];
    return formats.some((f) => /EAC3_JOC|DOLBY/i.test(f));
  } catch {
    return false;
  }
}

async function probeTrackv2(
  id: string,
  provider: ProviderPayload
): Promise<{ url?: string; quality?: string } | null> {
  try {
    const res = await fetch(`${requireApiBase()}/trackv2/?id=${id}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { url?: string; quality?: string } };
    provider.trackv2 = body;
    return body.data ?? null;
  } catch {
    return null;
  }
}

async function probeTrack(
  id: string,
  quality: string,
  provider: ProviderPayload
): Promise<{ kind: "dash"; manifest: string; actualAtmos: boolean } | { kind: "direct"; url: string; actualAtmos: boolean } | null> {
  try {
    const res = await fetch(
      `${requireApiBase()}/track/?id=${id}&quality=${quality}`,
      { cache: "no-store", signal: AbortSignal.timeout(PROBE_TIMEOUT) }
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { manifest?: string } };
    provider.track = body;
    const b64 = body.data?.manifest;
    if (!b64) return null;
    const decoded = Buffer.from(b64, "base64").toString("utf-8");
    const actualAtmos = manifestIsAtmos(decoded);
    if (isMpd(decoded)) {
      return {
        kind: "dash",
        manifest: `/api/stream/manifest?id=${id}&quality=${quality}`,
        actualAtmos,
      };
    }
    try {
      const parsed = JSON.parse(decoded) as { urls?: string[] };
      const url = parsed.urls?.[0];
      if (url)
        return {
          kind: "direct",
          url: `/api/stream?id=${id}&src=track&quality=${quality}`,
          actualAtmos,
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
  const atmosHint = req.nextUrl.searchParams.get("atmos") === "1";

  const provider: ProviderPayload = {};

  const direct = await probeTrackv2(id, provider);
  if (direct?.url) {
    const atmos = atmosHint ? await detectAtmos(id, provider) : false;
    return json({
      provider,
      data: {
        mode: "direct",
        url: `/api/stream?id=${id}`,
        quality: direct.quality ?? DEFAULT_QUALITY,
        atmos,
        playingAtmos: false,
      },
    });
  }

  const track = await probeTrack(id, DEFAULT_QUALITY, provider);
  if (!track) {
    return new Response("no playback source", { status: 502 });
  }

  const atmos = track.actualAtmos || (atmosHint ? await detectAtmos(id, provider) : false);

  if (track.kind === "direct") {
    return json({
      provider,
      data: { mode: "direct", url: track.url, quality: DEFAULT_QUALITY, atmos, playingAtmos: track.actualAtmos },
    });
  }

  if (atmos && !track.actualAtmos) {
    return json({
      provider,
      data: {
        mode: "dash",
        manifest: `/api/stream/manifest?id=${id}&quality=${DEFAULT_QUALITY}&atmos=1`,
        fallbackManifest: `/api/stream/manifest?id=${id}&quality=${DEFAULT_QUALITY}`,
        quality: DEFAULT_QUALITY,
        atmos: true,
        playingAtmos: true,
      },
    });
  }

  return json({
    provider,
    data: {
      mode: "dash",
      manifest: track.manifest,
      fallbackManifest: track.manifest,
      quality: DEFAULT_QUALITY,
      atmos,
      playingAtmos: track.actualAtmos,
    },
  });
}