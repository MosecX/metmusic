import type { NextRequest } from "next/server";

const TIDAL_IMAGE_HOST = "resources.tidal.com";

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) return new Response("missing url", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return new Response("invalid url", { status: 400 });
  }

  if (
    parsed.hostname !== TIDAL_IMAGE_HOST ||
    !parsed.pathname.endsWith(".jpg")
  ) {
    return new Response("not allowed", { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(rawUrl, { cache: "force-cache" });
  } catch {
    return new Response("upstream error", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response("image error", { status: upstream.status });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const cacheControl = upstream.headers.get("cache-control");
  if (cacheControl) headers.set("cache-control", cacheControl);
  headers.set("access-control-allow-origin", "*");
  headers.set("cache-control", "public, max-age=86400, s-maxage=86400, immutable");

  return new Response(upstream.body, { status: 200, headers });
}
