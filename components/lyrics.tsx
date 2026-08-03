"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

interface AmLyricsProps {
  songTitle?: string;
  songArtist?: string;
  songAlbum?: string;
  songDurationMs?: number;
  query?: string;
  highlightColor?: string;
  autoScroll?: boolean;
  interpolate?: boolean;
  className?: string;
  onLineClick?: (e: Event) => void;
}

interface LyricsElement extends HTMLElement {
  currentTime: number;
}

let lyricsModule: Promise<ComponentType<AmLyricsProps> | null> | null = null;

function loadAmLyrics(): Promise<ComponentType<AmLyricsProps> | null> {
  if (!lyricsModule) {
    lyricsModule = Promise.all([
      import("@uimaxbai/am-lyrics/am-lyrics.js"),
      import("@uimaxbai/am-lyrics/react"),
    ])
      .then(([, mod]) => mod.AmLyrics as unknown as ComponentType<AmLyricsProps>)
      .catch(() => null);
  }
  return lyricsModule;
}

export function LyricsSection({
  title,
  artist,
  album,
  durationSec,
  getAudio,
  onSeek,
}: {
  title: string;
  artist: string;
  album?: string;
  durationSec?: number;
  getAudio: () => HTMLAudioElement | null;
  onSeek: (seconds: number) => void;
}) {
  const [AmLyrics, setAmLyrics] = useState<ComponentType<AmLyricsProps> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    void loadAmLyrics().then((C) => {
      if (mounted && C) setAmLyrics(() => C);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      const audio = getAudio();
      const el = wrapRef.current?.querySelector<LyricsElement>("am-lyrics");
      if (audio && el) el.currentTime = audio.currentTime * 1000;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [getAudio]);

  useEffect(() => {
    const el = wrapRef.current?.querySelector<LyricsElement>("am-lyrics");
    if (!el) return;
    const fetchLyrics = (
      el as unknown as { fetchLyrics?: () => void }
    ).fetchLyrics;
    if (typeof fetchLyrics === "function") fetchLyrics.call(el);
  }, [AmLyrics, title, artist]);

  const handleLineClick = (e: Event) => {
    const detail = (e as CustomEvent<{ timestamp: number }>).detail;
    if (detail && typeof detail.timestamp === "number") {
      onSeek(detail.timestamp / 1000);
      getAudio()?.play();
    }
  };

  if (!AmLyrics) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-yellow-300" />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="flex min-h-0 flex-1 items-center justify-center px-4 md:px-8">
      <AmLyrics
        key={`${title}::${artist}`}
        className="h-full w-full max-w-3xl"
        songTitle={title}
        songArtist={artist}
        songAlbum={album}
        songDurationMs={durationSec ? durationSec * 1000 : undefined}
        query={`${title} ${artist}`.trim()}
        highlightColor="#fff"
        autoScroll
        interpolate
        onLineClick={handleLineClick}
      />
    </div>
  );
}
