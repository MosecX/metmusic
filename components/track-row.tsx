"use client";

import Link from "next/link";
import Image from "next/image";
import { usePlayer } from "@/components/player";
import { coverUrl, trackArtists, type Track } from "@/lib/tidal";
import { formatDuration } from "@/lib/utils";
import { QualityBadge } from "@/components/quality-badge";
import { IconPause, IconPlay, IconSparkle } from "@/components/icons";

function TrackRow({
  track,
  index,
  queue,
  showAlbum = true,
  onPlay,
}: {
  track: Track;
  index: number;
  queue?: Track[];
  showAlbum?: boolean;
  onPlay?: () => void;
}) {
  const { currentTrack, isPlaying, playTrack, toggle } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;
  const playing = isCurrent && isPlaying;
  const cover = coverUrl(track.album?.cover, 160);

  const handlePlay = () => {
    if (isCurrent) {
      toggle();
    } else {
      playTrack(track, queue);
    }
    onPlay?.();
  };

  return (
    <div
      className={`group relative grid cursor-pointer grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/10 md:grid-cols-[2rem_minmax(0,2fr)_minmax(0,1fr)_3rem_4rem] md:gap-4 ${
        isCurrent ? "bg-white/10" : ""
      }`}
    >
      <button
        type="button"
        aria-label={`${playing ? "Pause" : "Play"} ${track.title}`}
        onClick={handlePlay}
        className="absolute inset-0 z-0 cursor-pointer rounded-xl focus-visible:bg-white/10"
      />

      <div className="flex items-center justify-end">
        {isCurrent ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
            aria-label={playing ? "Pause" : "Play"}
            className="relative z-10 text-sky-400"
          >
            {playing ? (
              <IconPause className="h-4 w-4" />
            ) : (
              <IconPlay className="h-4 w-4" />
            )}
          </button>
        ) : (
          <>
            <span className="text-sm tabular-nums text-white/40 group-hover:hidden max-md:hidden">
              {index + 1}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
              aria-label="Play"
              className="relative z-10 hidden h-8 w-8 items-center justify-center rounded-full text-white transition hover:bg-white/10 group-hover:block max-md:flex"
            >
              <IconPlay className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-3">
        {showAlbum && cover && (
          <Image
            src={cover}
            alt=""
            width={40}
            height={40}
            sizes="40px"
            className="h-10 w-10 shrink-0 rounded object-cover"
          />
        )}
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p
              className={`truncate text-sm ${
                isCurrent ? "font-medium text-sky-400" : "text-white"
              }`}
            >
              {track.title}
            </p>
            {track.id && <QualityBadge trackId={track.id} />}
          </div>
          <Link
            href={`/artist/${track.artist?.id ?? track.artists?.[0]?.id ?? ""}`}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 block truncate text-xs text-white/50 hover:text-white hover:underline"
          >
            {trackArtists(track)}
          </Link>
        </div>
      </div>

      {showAlbum && (
        <Link
          href={`/album/${track.album?.id ?? ""}`}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 hidden truncate text-sm text-white/50 hover:text-white hover:underline md:block"
        >
          {track.album?.title ?? "—"}
        </Link>
      )}

      <span className="hidden text-sm tabular-nums text-white/40 md:block">
        {formatDuration(track.duration)}
      </span>

      <div className="flex items-center justify-end gap-2">
        {track.mixes?.TRACK_MIX && (
          <Link
            href={`/mix/${track.mixes.TRACK_MIX}`}
            onClick={(e) => e.stopPropagation()}
            aria-label="Open mix"
            title="Open mix"
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-amber-400"
          >
            <IconSparkle className="h-5 w-5" />
          </Link>
        )}
        {track.explicit && (
          <span
            className="flex h-4 w-4 items-center justify-center rounded-sm bg-white/10 text-[8px] font-bold text-white/60"
            title="Explicit"
          >
            E
          </span>
        )}
      </div>
    </div>
  );
}

export function TrackList({
  tracks,
  queue,
  showAlbum = true,
  className = "",
}: {
  tracks: Track[];
  queue?: Track[];
  showAlbum?: boolean;
  className?: string;
}) {
  return (
    <div className={`glass rounded-2xl p-2 ${className}`}>
      {tracks.map((track, i) => (
        <TrackRow
          key={track.id}
          track={track}
          index={i}
          queue={queue ?? tracks}
          showAlbum={showAlbum}
        />
      ))}
    </div>
  );
}
