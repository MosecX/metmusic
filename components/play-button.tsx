"use client";

import { usePlayer } from "@/components/player";
import type { Track } from "@/lib/tidal";
import { IconPause, IconPlay } from "@/components/icons";

export function PlayAllButton({
  tracks,
  size = "lg",
}: {
  tracks: Track[];
  size?: "sm" | "lg";
}) {
  const { playQueue, currentTrack, isPlaying, toggle } = usePlayer();

  if (!tracks.length) return null;

  const currentInQueue = currentTrack && tracks.some((t) => t.id === currentTrack.id);
  const playing = currentInQueue && isPlaying;

  const handleClick = () => {
    if (currentInQueue) {
      toggle();
      return;
    }
    playQueue(tracks, 0);
  };

  const isLarge = size === "lg";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={playing ? "Pause" : "Play"}
      className={`flex items-center justify-center rounded-full bg-white text-black shadow-lg shadow-white/20 transition hover:scale-105 hover:shadow-white/40 ${
        isLarge ? "h-14 w-14" : "h-11 w-11"
      }`}
    >
      {playing ? (
        <IconPause className={isLarge ? "h-6 w-6" : "h-5 w-5"} />
      ) : (
        <IconPlay className={`ml-0.5 ${isLarge ? "h-6 w-6" : "h-5 w-5"}`} />
      )}
    </button>
  );
}
