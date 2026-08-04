"use client";

import { usePlayer } from "@/components/player";

export function LyricsPreview({ text }: { text: string }) {
  const { currentTrack, openVisualizer } = usePlayer();

  return (
    <div>
      <div className="relative max-h-48 overflow-hidden rounded-2xl glass-soft p-6">
        <p className="whitespace-pre-line text-sm leading-relaxed text-white/80">{text}</p>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0a0a10] via-[#0a0a10]/60 to-transparent" />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/40">
          Preview — full synced lyrics are available in the player
        </p>
        <button
          type="button"
          onClick={openVisualizer}
          disabled={!currentTrack}
          className={`rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold transition ${
            currentTrack
              ? "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
              : "cursor-not-allowed bg-white/5 text-white/30"
          }`}
        >
          Open in player
        </button>
      </div>
    </div>
  );
}
