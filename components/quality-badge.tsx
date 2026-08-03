"use client";

import { useEffect, useState } from "react";
import { qualityClass, qualityShort } from "@/lib/utils";
import { IconSparkle } from "@/components/icons";

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();
let chain: Promise<unknown> = Promise.resolve();

function fetchQuality(trackId: string): Promise<string | null> {
  const hit = cache.get(trackId);
  if (hit) return Promise.resolve(hit);
  if (inflight.has(trackId)) return inflight.get(trackId)!;

  const p = chain.then(async () => {
    try {
      const res = await fetch(`/api/stream/info?id=${trackId}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { quality?: string };
      const q = data.quality ?? null;
      if (q) cache.set(trackId, q);
      return q;
    } catch {
      return null;
    }
  });
  inflight.set(trackId, p);
  chain = p.then(
    () => new Promise((r) => setTimeout(r, 300)),
    () => new Promise((r) => setTimeout(r, 300))
  );
  return p;
}

export function QualityBadgeView({
  quality,
  size = "sm",
  className = "",
}: {
  quality: string | null;
  size?: "sm" | "lg";
  className?: string;
}) {
  const label = qualityShort(quality ?? undefined);
  if (!label) return null;
  const hiRes = (quality ?? "").toUpperCase().startsWith("HI_RES");
  const sizeCls = size === "lg" ? "px-3 py-1 text-[11px]" : "px-2 py-0.5 text-[9px]";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border font-bold uppercase tracking-wider ${sizeCls} ${qualityClass(
        quality ?? undefined
      )} ${className}`}
      title={(quality ?? "").replace(/_/g, " ")}
    >
      {hiRes ? (
        <IconSparkle className="h-2.5 w-2.5" />
      ) : (
        <span className="h-1 w-1 rounded-full bg-current opacity-60" />
      )}
      {label}
    </span>
  );
}

export function QualityBadge({
  trackId,
  className = "",
}: {
  trackId?: string | number;
  className?: string;
}) {
  const [state, setState] = useState<"loading" | "done">(() =>
    trackId == null ? "done" : "loading"
  );
  const [quality, setQuality] = useState<string | null>(null);

  useEffect(() => {
    if (trackId == null) return;
    const key = String(trackId);
    let cancelled = false;
    void fetchQuality(key).then((q) => {
      if (cancelled) return;
      setQuality(q);
      setState("done");
    });
    return () => {
      cancelled = true;
    };
  }, [trackId]);

  if (state === "loading") {
    return (
      <span className="inline-flex h-[18px] w-[52px] shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-yellow-300" />
      </span>
    );
  }

  if (!quality) return null;
  return <QualityBadgeView quality={quality} className={className} />;
}
