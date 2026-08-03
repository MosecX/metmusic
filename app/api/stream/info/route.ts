import type { NextRequest } from "next/server";
import { requireApiBase } from "@/lib/tidal";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return new Response("missing id", { status: 400 });

  let mode: "direct" | "dash" = "dash";
  let quality = "HI_RES_LOSSLESS";
  try {
    const res = await fetch(`${requireApiBase()}/trackv2/?id=${id}`, { cache: "no-store" });
    if (res.ok) {
      const body = (await res.json()) as {
        data?: { url?: string; quality?: string; codecs?: string };
      };
      if (body.data?.url) {
        mode = "direct";
        if (body.data.quality) quality = body.data.quality;
      }
    }
  } catch {
    /* fall through to dash */
  }

  return Response.json(payload(mode, quality, id));
}

function payload(
  mode: "direct" | "dash",
  quality: string,
  id: string
): Record<string, string> {
  return mode === "direct"
    ? { mode: "direct", url: `/api/stream?id=${id}`, quality }
    : { mode: "dash", manifest: `/api/stream/manifest?id=${id}`, quality };
}
