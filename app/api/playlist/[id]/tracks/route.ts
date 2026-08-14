import type { NextRequest } from "next/server";
import { getPlaylistPage } from "@/lib/tidal";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get("offset")) || 0);
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 50));

  try {
    const { items } = await getPlaylistPage(id, limit, offset);
    return Response.json({ items, offset });
  } catch {
    return Response.json(
      { error: "Failed to load playlist tracks" },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }
}