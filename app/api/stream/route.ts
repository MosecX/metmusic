import type { NextRequest } from "next/server";
import { requireApiBase } from "@/lib/tidal";

async function resolveStreamUrl(id: string): Promise<string | null> {
  try {
    const res = await fetch(`${requireApiBase()}/trackv2/?id=${id}`, { cache: "no-store" });
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

  const streamUrl = await resolveStreamUrl(id);
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
