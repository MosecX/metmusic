"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Track } from "@/lib/tidal";
import { formatDuration } from "@/lib/utils";
import { PlayAllButton } from "@/components/play-button";
import { TrackList } from "@/components/track-row";
import { IconMusic } from "@/components/icons";

const PAGE = 50;

export function PlaylistContent({
  id,
  title,
  description,
  cover,
  duration,
  total,
  initialItems,
}: {
  id: string;
  title: string;
  description?: string | null;
  cover: string | null;
  duration?: number;
  total: number;
  initialItems: Track[];
}) {
  const [items, setItems] = useState<Track[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [noMore, setNoMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const done = noMore || items.length >= total;

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    if (itemsRef.current.length >= total) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const offset = itemsRef.current.length;
      const res = await fetch(
        `/api/playlist/${encodeURIComponent(id)}/tracks?offset=${offset}&limit=${PAGE}`
      );
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { items: Track[] };
      setItems((prev) => {
        const seen = new Set(prev.map((t) => t.id));
        return [...prev, ...data.items.filter((t) => !seen.has(t.id))];
      });
      if (!data.items.length) setNoMore(true);
    } catch {
      setError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [id, total]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadMore();
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <div>
      <div className="glass mb-8 flex flex-col gap-6 rounded-3xl p-6 md:flex-row md:items-end md:gap-8 md:p-8">
        <div className="shrink-0">
          {cover ? (
            <Image
              src={cover}
              alt={title}
              width={240}
              height={240}
              sizes="(max-width: 768px) 192px, 240px"
              className="h-48 w-48 rounded-2xl object-cover shadow-2xl shadow-black/60 ring-1 ring-white/10 md:h-60 md:w-60"
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-white/5 text-white/30 md:h-60 md:w-60">
              <IconMusic className="h-16 w-16" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Playlist
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
              {description}
            </p>
          )}
          <p className="mt-3 text-sm text-white/60">
            {total} songs
            {duration ? ` · ${formatDuration(duration)}` : ""}
          </p>
          <div className="mt-6">
            <PlayAllButton tracks={items} />
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <TrackList tracks={items} />
      ) : (
        <p className="py-10 text-center text-sm text-white/40">
          This playlist has no playable tracks.
        </p>
      )}

      {!done && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loading ? (
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-sky-400" />
          ) : error ? (
            <button
              type="button"
              onClick={() => void loadMore()}
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
            >
              Could not load more — Retry
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}