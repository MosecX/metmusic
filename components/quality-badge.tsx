"use client";

import { useEffect, useState } from "react";
import { qualityClass, qualityShort } from "@/lib/utils";
import { IconAtmos, IconSparkle, IconAlert } from "@/components/icons";

export function AtmosBadge({
  size = "sm",
  className = "",
}: {
  size?: "sm" | "lg";
  className?: string;
}) {
  const sizeCls = size === "lg" ? "px-3 py-1 text-[11px]" : "px-2 py-0.5 text-[9px]";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-300/50 bg-cyan-400/15 font-bold uppercase tracking-wider text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.35)] backdrop-blur-md ${sizeCls} ${className}`}
      title="Dolby Atmos (spatial) — playback not guaranteed"
    >
      <IconAtmos className="h-2.5 w-2.5" />
      Atmos
    </span>
  );
}

export function DolbyStatusBadge({
  atmos,
  playingAtmos,
  size = "sm",
  className = "",
}: {
  atmos: boolean;
  playingAtmos: boolean;
  size?: "sm" | "lg";
  className?: string;
}) {
  if (!atmos) return null;
  const sizeCls = size === "lg" ? "px-3 py-1 text-[11px]" : "px-2 py-0.5 text-[9px]";

  if (playingAtmos) {
    return (
      <span
        className={`dolby-ok inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-300/60 bg-cyan-400/20 font-bold uppercase tracking-wider text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.55)] backdrop-blur-md ${sizeCls} ${className}`}
        title="Reproduciendo en Dolby Atmos"
      >
        <IconAtmos className={size === "lg" ? "h-3 w-3" : "h-2.5 w-2.5"} />
        Dolby
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/60 bg-amber-400/15 font-bold uppercase tracking-wider text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.35)] backdrop-blur-md ${sizeCls} ${className}`}
      title="Este tema es Dolby Atmos, pero no se pudo reproducir en Dolby — sonando en otro formato"
    >
      <IconAlert className={size === "lg" ? "h-3 w-3" : "h-2.5 w-2.5"} />
      Dolby · FLAC
    </span>
  );
}

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
      const body = (await res.json()) as { data?: { quality?: string } };
      const q = body.data?.quality ?? null;
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
