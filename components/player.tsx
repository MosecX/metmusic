"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { type Track, coverUrl, trackArtists } from "@/lib/tidal";
import { formatDuration } from "@/lib/utils";
import { QualityBadgeView } from "@/components/quality-badge";
import { LyricsSection } from "@/components/lyrics";
import type * as dashjs from "dashjs";

import {
  IconClose,
  IconMusic,
  IconNext,
  IconPause,
  IconPlay,
  IconPrev,
  IconRepeat,
  IconShuffle,
  IconSparkle,
  IconVolume,
} from "@/components/icons";

function fillStyle(pct: number): CSSProperties {
  return { "--fill": `${pct}%` } as CSSProperties;
}

function attachDashListeners(
  dp: dashjs.MediaPlayerClass,
  events: typeof dashjs.MediaPlayer.events,
  started: () => void,
  failed: (event: unknown) => void,
  ended: () => void
): () => void {
  dp.on(events.PLAYBACK_STARTED, started);
  dp.on(events.ERROR, failed);
  dp.on(events.PLAYBACK_ENDED, ended);
  return () => {
    dp.off(events.PLAYBACK_STARTED, started);
    dp.off(events.ERROR, failed);
    dp.off(events.PLAYBACK_ENDED, ended);
  };
}

type RepeatMode = "off" | "all" | "one";

interface StreamInfo {
  mode: "direct" | "dash";
  url?: string;
  manifest?: string;
  quality?: string;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  loading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  error: string | null;
  playingQuality: string | null;
  playTrack: (track: Track, queue?: Track[]) => void;
  playQueue: (queue: Track[], index: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  getAudio: () => HTMLAudioElement | null;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dashPlayerRef = useRef<dashjs.MediaPlayerClass | null>(null);
  const dashListenersRef = useRef<Array<() => void>>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [error, setError] = useState<string | null>(null);
  const [playingQuality, setPlayingQuality] = useState<string | null>(null);

  const indexRef = useRef(-1);
  const queueRef = useRef<Track[]>([]);
  const advancingRef = useRef(false);
  const repeatRef = useRef(repeat);
  const shuffleRef = useRef(shuffle);
  const handleEndedRef = useRef<() => void>(() => {});

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const destroyDash = useCallback(() => {
    const dp = dashPlayerRef.current;
    if (dp) {
      try {
        dp.reset();
      } catch {
        /* ignore */
      }
      dashPlayerRef.current = null;
    }
    const listeners = dashListenersRef.current;
    dashListenersRef.current = [];
    for (const off of listeners) {
      try {
        off();
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    return () => destroyDash();
  }, [destroyDash]);

  const suppressErrorRef = useRef(false);

  const loadAndPlay = useCallback(
    async (track: Track, list: Track[], i: number) => {
      indexRef.current = i;
      setQueue(list);
      setCurrentTrack(track);
      try {
        document.cookie = `last_played=${track.id}; max-age=31536000; path=/; samesite=lax`;
      } catch {
        /* ignore */
      }
      setError(null);
      setLoading(true);
      suppressErrorRef.current = true;
      advancingRef.current = true;

      const audio = audioRef.current;
      if (!audio) return;

      destroyDash();

      try {
        const res = await fetch(`/api/stream/info?id=${track.id}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Stream unavailable (${res.status})`);
        const info = (await res.json()) as StreamInfo;
        if (indexRef.current !== i) return;
        setPlayingQuality(info.quality ?? track.audioQuality ?? null);

        if (info.mode === "direct" && info.url) {
          audio.src = info.url;
          audio.load();
          await audio.play();
          setIsPlaying(true);
          advancingRef.current = false;
          suppressErrorRef.current = false;
        } else if (info.mode === "dash" && info.manifest) {
          const dashjsMod = await import("dashjs");
          const dp = dashjsMod.MediaPlayer().create();
          dashPlayerRef.current = dp;
          dp.initialize(audio, info.manifest, true);
          const started = () => {
            if (indexRef.current === i) {
              setIsPlaying(true);
              advancingRef.current = false;
              suppressErrorRef.current = false;
            }
          };
          const failed = (event: unknown) => {
            const detail = event as unknown as { error?: { message?: string } };
            if (indexRef.current === i) {
              setError(detail.error?.message ?? "DASH playback error");
              setIsPlaying(false);
              advancingRef.current = false;
              suppressErrorRef.current = false;
            }
          };
          const ended = () => {
            if (indexRef.current === i) handleEndedRef.current();
          };
          dashListenersRef.current = [
            attachDashListeners(dp, dashjsMod.MediaPlayer.events, started, failed, ended),
          ];
        } else {
          throw new Error("No playback source available");
        }
      } catch (e) {
        suppressErrorRef.current = false;
        advancingRef.current = false;
        if (indexRef.current === i) {
          setError(e instanceof Error ? e.message : "Playback failed");
          setIsPlaying(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [destroyDash]
  );

  const playQueue = useCallback(
    (list: Track[], i: number) => {
      if (!list.length) return;
      const safeIndex = Math.min(Math.max(i, 0), list.length - 1);
      void loadAndPlay(list[safeIndex], list, safeIndex);
    },
    [loadAndPlay]
  );

  const playTrack = useCallback(
    (track: Track, queue?: Track[]) => {
      const list = queue && queue.length ? queue : [track];
      const i = list.findIndex((t) => t.id === track.id);
      playQueue(list, i >= 0 ? i : 0);
    },
    [playQueue]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.paused) {
      audio.play().catch(() => setError("Playback failed"));
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [currentTrack]);

  const advanceToNext = useCallback(() => {
    const list = queueRef.current;
    if (!list.length) return;
    if (shuffleRef.current) {
      const i = Math.floor(Math.random() * list.length);
      void loadAndPlay(list[i], list, i);
      return;
    }
    const i = indexRef.current;
    if (i >= list.length - 1) {
      if (repeatRef.current === "all") {
        void loadAndPlay(list[0], list, 0);
        return;
      }
      advancingRef.current = false;
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
      return;
    }
    void loadAndPlay(list[i + 1], list, i + 1);
  }, [loadAndPlay]);

  const next = useCallback(() => {
    advanceToNext();
  }, [advanceToNext]);

  const prev = useCallback(() => {
    const list = queueRef.current;
    if (!list.length) return;
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (shuffleRef.current) {
      const i = Math.floor(Math.random() * list.length);
      void loadAndPlay(list[i], list, i);
      return;
    }
    const i = indexRef.current;
    const target = i > 0 ? i - 1 : list.length - 1;
    void loadAndPlay(list[target], list, target);
  }, [loadAndPlay]);

  const handleEnded = useCallback(() => {
    if (advancingRef.current) return;
    if (repeatRef.current === "one") {
      advancingRef.current = true;
      const audio = audioRef.current;
      const dp = dashPlayerRef.current;
      if (dp) {
        try {
          dp.seek(0);
          dp.play();
        } catch {
          /* ignore */
        }
        window.setTimeout(() => {
          advancingRef.current = false;
        }, 300);
      } else if (audio) {
        audio.currentTime = 0;
        void audio.play().finally(() => {
          advancingRef.current = false;
        });
      }
      return;
    }
    advancingRef.current = true;
    advanceToNext();
  }, [advanceToNext]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = time;
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(Math.max(v, 0), 1);
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);
  const getAudio = useCallback(() => audioRef.current, []);

  const stateRef = useRef({ isPlaying, currentTime, duration, volume, currentTrack });
  const toggleRef = useRef(toggle);
  const nextRef = useRef(next);
  const prevRef = useRef(prev);
  const seekRef = useRef(seek);
  const setVolumeRef = useRef(setVolume);

  useEffect(() => {
    stateRef.current = { isPlaying, currentTime, duration, volume, currentTrack };
    toggleRef.current = toggle;
    nextRef.current = next;
    prevRef.current = prev;
    seekRef.current = seek;
    setVolumeRef.current = setVolume;
    repeatRef.current = repeat;
    shuffleRef.current = shuffle;
    handleEndedRef.current = handleEnded;
  });

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;

    const handleSeekBackward = (details: MediaSessionActionDetails) => {
      const base = stateRef.current.currentTime;
      seekRef.current(Math.max(base - (details.seekOffset ?? 10), 0));
    };
    const handleSeekForward = (details: MediaSessionActionDetails) => {
      const base = stateRef.current.currentTime;
      const dur = stateRef.current.duration || base;
      seekRef.current(Math.min(base + (details.seekOffset ?? 10), dur));
    };
    const handleSeekTo = (details: MediaSessionActionDetails) => {
      if (typeof details.seekTime === "number") seekRef.current(details.seekTime);
    };

    try { ms.setActionHandler("play", () => { if (!stateRef.current.isPlaying) toggleRef.current(); }); } catch { /* ignore */ }
    try { ms.setActionHandler("pause", () => { if (stateRef.current.isPlaying) toggleRef.current(); }); } catch { /* ignore */ }
    try { ms.setActionHandler("previoustrack", () => prevRef.current()); } catch { /* ignore */ }
    try { ms.setActionHandler("nexttrack", () => nextRef.current()); } catch { /* ignore */ }
    try { ms.setActionHandler("seekbackward", handleSeekBackward); } catch { /* ignore */ }
    try { ms.setActionHandler("seekforward", handleSeekForward); } catch { /* ignore */ }
    try { ms.setActionHandler("seekto", handleSeekTo); } catch { /* ignore */ }

    return () => {
      const actions: MediaSessionAction[] = [
        "play", "pause", "previoustrack", "nexttrack",
        "seekbackward", "seekforward", "seekto",
      ];
      for (const action of actions) {
        try { ms.setActionHandler(action, null); } catch { /* ignore */ }
      }
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    if (!currentTrack) {
      ms.metadata = null;
      return;
    }
    const cover = coverUrl(currentTrack.album?.cover, 640);
    const artwork = cover
      ? [{ src: `/api/artwork?url=${encodeURIComponent(cover)}`, sizes: "640x640", type: "image/jpeg" }]
      : [];
    ms.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: trackArtists(currentTrack),
      album: currentTrack.album?.title ?? undefined,
      artwork,
    });
  }, [currentTrack]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    } catch { /* ignore */ }
  }, [isPlaying]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    if (!currentTrack || !duration) {
      try { ms.setPositionState?.(); } catch { /* ignore */ }
      return;
    }
    try {
      ms.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(currentTime, duration),
      });
    } catch { /* ignore */ }
  }, [currentTrack, currentTime, duration]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || tag === "A") return;
      if (e.defaultPrevented) return;
      const s = stateRef.current;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (s.currentTrack) toggleRef.current();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekRef.current(Math.max(s.currentTime - 10, 0));
          break;
        case "ArrowRight":
          e.preventDefault();
          seekRef.current(Math.min(s.currentTime + 10, s.duration || s.currentTime));
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolumeRef.current(Math.min(s.volume + 0.05, 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolumeRef.current(Math.max(s.volume - 0.05, 0));
          break;
        case "KeyM":
          e.preventDefault();
          setVolumeRef.current(s.volume > 0 ? 0 : 0.85);
          break;
        case "KeyN":
          if (s.currentTrack) nextRef.current();
          break;
        case "KeyP":
          if (s.currentTrack) prevRef.current();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo<PlayerState>(
    () => ({
      currentTrack,
      queue,
      isPlaying,
      loading,
      currentTime,
      duration,
      volume,
      shuffle,
      repeat,
      error,
      playingQuality,
      playTrack,
      playQueue,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      toggleShuffle,
      cycleRepeat,
      getAudio,
    }),
    [
      currentTrack,
      queue,
      isPlaying,
      loading,
      currentTime,
      duration,
      volume,
      shuffle,
      repeat,
      error,
      playingQuality,
      playTrack,
      playQueue,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      toggleShuffle,
      cycleRepeat,
      getAudio,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        className="hidden"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={() => {
          handleEndedRef.current();
        }}
        onError={() => {
          if (suppressErrorRef.current) return;
          advancingRef.current = false;
          if (indexRef.current >= 0) {
            setError("Unable to play this track");
            setIsPlaying(false);
            setLoading(false);
          }
        }}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    loading,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    error,
    playingQuality,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const [visualizerOpen, setVisualizerOpen] = useState(false);

  const cover = currentTrack ? coverUrl(currentTrack.album?.cover, 160) : null;
  const bigCover = currentTrack ? coverUrl(currentTrack.album?.cover, 1280) : null;

  const seekPct = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const volPct = volume * 100;

  const quality = playingQuality ?? currentTrack?.audioQuality ?? null;

  const openVisualizer = () => {
    if (currentTrack) setVisualizerOpen(true);
  };

  return (
    <div className="glass-strong fixed inset-x-0 bottom-0 z-40 rounded-t-2xl">
      {/* Mobile layout */}
      <div className="flex flex-col gap-1.5 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 md:hidden">
        <div className="flex items-center gap-3">
          {cover ? (
            <button
              type="button"
              onClick={openVisualizer}
              aria-label="Open visualizer"
              className="shrink-0 cursor-pointer"
            >
              <Image
                src={cover}
                alt=""
                width={44}
                height={44}
                sizes="44px"
                className="h-11 w-11 rounded-lg object-cover ring-1 ring-white/10"
              />
            </button>
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/40">
              <IconMusic className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-medium text-white">
                {currentTrack?.title ?? "Nothing playing"}
              </p>
              {currentTrack && <QualityBadgeView quality={quality} />}
            </div>
            <p className="truncate text-xs text-white/50">
              {currentTrack ? trackArtists(currentTrack) : "Select a track"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:text-white"
            >
              <IconPrev className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={toggle}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-white/20 transition hover:scale-105"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              ) : isPlaying ? (
                <IconPause className="h-5 w-5" />
              ) : (
                <IconPlay className="ml-0.5 h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:text-white"
            >
              <IconNext className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex w-full items-center gap-2 text-[11px] tabular-nums text-white/50">
          <span className="w-9 shrink-0 text-right">{formatDuration(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.5}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            className="progress-slider flex-1"
            style={fillStyle(seekPct)}
            aria-label="Seek"
          />
          <span className="w-9 shrink-0">{formatDuration(duration)}</span>
        </div>
        {error && <p className="truncate px-1 text-[11px] text-rose-400">{error}</p>}
      </div>

      {/* Desktop layout */}
      <div className="hidden h-[88px] grid-cols-[minmax(0,1fr)_minmax(320px,2fr)_minmax(0,1fr)] items-center gap-3 px-6 md:grid">
        <div className="flex min-w-0 items-center gap-3">
          {cover ? (
            <button
              type="button"
              onClick={openVisualizer}
              aria-label="Open visualizer"
              className="group relative shrink-0 cursor-pointer"
              title="Open visualizer"
            >
              <Image
                src={cover}
                alt=""
                width={56}
                height={56}
                sizes="56px"
                className="h-14 w-14 rounded-xl object-cover ring-1 ring-white/10 transition duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-white/10"
              />
              <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 text-white opacity-0 transition duration-200 group-hover:bg-black/30 group-hover:opacity-100">
                <IconSparkle className="h-5 w-5" />
              </span>
            </button>
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/40">
              <IconMusic className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-medium text-white">
                {currentTrack?.title ?? "Nothing playing"}
              </p>
              {currentTrack && <QualityBadgeView quality={quality} />}
            </div>
            <p className="truncate text-xs text-white/50">
              {currentTrack ? trackArtists(currentTrack) : "Select a track"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleShuffle}
              aria-label="Shuffle"
              className={`text-white/60 transition hover:text-white ${
                shuffle ? "!text-sky-400" : ""
              }`}
            >
              <IconShuffle className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous"
              className="text-white/80 transition hover:text-white"
            >
              <IconPrev className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={toggle}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              ) : isPlaying ? (
                <IconPause className="h-5 w-5" />
              ) : (
                <IconPlay className="ml-0.5 h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next"
              className="text-white/80 transition hover:text-white"
            >
              <IconNext className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              aria-label="Repeat"
              className={`text-white/60 transition hover:text-white ${
                repeat !== "off" ? "!text-sky-400" : ""
              }`}
            >
              <IconRepeat className="h-4 w-4" />
              {repeat === "one" && (
                <span className="absolute ml-2 text-[9px] font-bold">1</span>
              )}
            </button>
          </div>
<div className="flex w-full max-w-xl items-center gap-2 text-[11px] tabular-nums text-white/50">
          <span className="w-10 text-right">{formatDuration(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.5}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            className="slider-fine flex-1"
            style={fillStyle(seekPct)}
            aria-label="Seek"
          />
          <span className="w-10">{formatDuration(duration)}</span>
        </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          {error && (
            <span className="mr-2 max-w-[180px] truncate text-[11px] text-rose-400">
              {error}
            </span>
          )}
          <IconVolume className="h-4 w-4 text-white/60" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="slider-fine w-24"
            style={fillStyle(volPct)}
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Fullscreen visualizer */}
      {visualizerOpen && currentTrack && bigCover && typeof document !== "undefined"
        ? createPortal(
            <Visualizer
              cover={bigCover}
              title={currentTrack.title}
              artist={trackArtists(currentTrack)}
              quality={quality}
              onClose={() => setVisualizerOpen(false)}
            />,
            document.body
          )
        : null}
    </div>
  );
}

function Visualizer({
  cover,
  title,
  artist,
  quality,
  onClose,
}: {
  cover: string;
  title: string;
  artist: string;
  quality: string | null;
  onClose: () => void;
}) {
  const {
    currentTrack,
    isPlaying,
    loading,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    getAudio,
  } = usePlayer();

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (dlg && !dlg.open) dlg.showModal();
  }, []);

  const seekPct = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const volPct = volume * 100;

  const iconBtn =
    "flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label="Visualizer"
      className="fixed inset-0 z-50 m-0 h-dvh max-h-full w-full max-w-full overflow-hidden border-0 bg-[#050508] p-0"
    >
      <div className="flex h-full w-full flex-col" onClick={onClose}>
        <div className="vz-layer vz-1" style={{ backgroundImage: `url(${cover})` }} />
        <div className="vz-layer vz-3" style={{ backgroundImage: `url(${cover})` }} />
        <div className="absolute inset-0 bg-black/65" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close visualizer"
          className="glass absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
        >
          <IconClose className="h-5 w-5" />
        </button>

        <div
          className="relative z-10 flex h-full flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-4 px-5 pt-5 md:px-8 md:pt-6">
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src={cover}
                alt={title}
                width={40}
                height={40}
                sizes="40px"
                className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-white/15"
              />
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-white md:text-base">
                  {title}
                </h2>
                <p className="truncate text-xs text-white/60">{artist}</p>
              </div>
            </div>
            {quality && (
              <QualityBadgeView quality={quality} size="lg" className="hidden sm:inline-flex" />
            )}
          </div>

          <LyricsSection
            title={title}
            artist={artist}
            album={currentTrack?.album?.title}
            durationSec={currentTrack?.duration}
            getAudio={getAudio}
            onSeek={seek}
          />

          <div className="flex flex-col items-center px-5 pb-6 md:px-8">
            <div className="flex w-full max-w-2xl flex-col items-center gap-3 rounded-2xl bg-black/35 px-5 py-4 backdrop-blur-md ring-1 ring-white/10">
              <div className="flex w-full items-center gap-2 text-[11px] tabular-nums text-white/60">
                <span className="w-10 text-right">{formatDuration(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.5}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              className="slider-fine flex-1"
              style={fillStyle(seekPct)}
              aria-label="Seek"
            />
            <span className="w-10">{formatDuration(duration)}</span>
          </div>
          <div className="flex w-full max-w-2xl items-center justify-center gap-1">
            <button
              type="button"
              onClick={toggleShuffle}
              aria-label="Shuffle"
              className={`${iconBtn} ${shuffle ? "!text-yellow-300" : ""}`}
            >
              <IconShuffle className="h-4 w-4" />
            </button>
            <button type="button" onClick={prev} aria-label="Previous" className={iconBtn}>
              <IconPrev className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={toggle}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="mx-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : isPlaying ? (
                <IconPause className="h-5 w-5" />
              ) : (
                <IconPlay className="ml-0.5 h-5 w-5" />
              )}
            </button>
            <button type="button" onClick={next} aria-label="Next" className={iconBtn}>
              <IconNext className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              aria-label="Repeat"
              className={`${iconBtn} ${repeat !== "off" ? "!text-yellow-300" : ""}`}
            >
              <IconRepeat className="h-4 w-4" />
            </button>
            <div className="ml-4 hidden items-center gap-2 md:flex">
              <IconVolume className="h-4 w-4 text-white/60" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="slider-fine w-24"
                style={fillStyle(volPct)}
                aria-label="Volume"
              />
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}


