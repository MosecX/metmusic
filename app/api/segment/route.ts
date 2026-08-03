import type { NextRequest } from "next/server";

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
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) return new Response("missing url", { status: 400 });

  let upstream: Response;
  try {
    const headers = new Headers();
    const range = req.headers.get("range");
    if (range) headers.set("range", range);
    upstream = await fetch(rawUrl, { headers, cache: "no-store" });
  } catch {
    return new Response("upstream error", { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response("segment error", { status: upstream.status });
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
