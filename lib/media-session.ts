import {
  MediaSession,
  type ActionHandler as CapgoMediaSessionActionHandler,
  type MediaSessionAction as CapgoMediaSessionAction,
} from "@capgo/capacitor-media-session";

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}

export type MediaSessionActionHandler = (details: MediaSessionActionDetails) => void;

const isNative = () =>
  typeof window !== "undefined" && !!window.Capacitor?.isNativePlatform?.();

export const mediaSessionSupported = () =>
  typeof navigator !== "undefined" &&
  (isNative() || "mediaSession" in navigator);

export function setMediaSessionMetadata(metadata: {
  title: string;
  artist?: string;
  album?: string;
  artwork?: { src: string; sizes?: string; type?: string }[];
}) {
  if (isNative()) {
    const artwork = metadata.artwork?.[0]
      ? [
          {
            src: new URL(metadata.artwork[0].src, window.location.href).href,
            sizes: metadata.artwork[0].sizes ?? "",
            type: metadata.artwork[0].type ?? "",
          },
        ]
      : [];
    void MediaSession.setMetadata({
      title: metadata.title,
      artist: metadata.artist ?? "",
      album: metadata.album ?? "",
      artwork,
    }).catch(() => {});
  } else if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata(metadata);
  }
}

export function clearMediaSessionMetadata() {
  if (isNative()) return;
  if ("mediaSession" in navigator) navigator.mediaSession.metadata = null;
}

export function setMediaSessionPlaybackState(state: "playing" | "paused") {
  if (isNative()) {
    void MediaSession.setPlaybackState({ playbackState: state }).catch(() => {});
  } else if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = state;
  }
}

export function setMediaSessionPositionState(position?: {
  duration: number;
  position: number;
  playbackRate?: number;
}) {
  if (isNative()) {
    void MediaSession.setPositionState({
      duration: position?.duration ?? 0,
      position: position?.position ?? 0,
      playbackRate: position?.playbackRate ?? 1,
    }).catch(() => {});
  } else if ("mediaSession" in navigator) {
    try {
      if (position) navigator.mediaSession.setPositionState(position);
      else navigator.mediaSession.setPositionState?.();
    } catch {
      /* ignore */
    }
  }
}

export function setMediaSessionActionHandler(
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null
) {
  if (isNative()) {
    void MediaSession.setActionHandler(
      { action: action as CapgoMediaSessionAction },
      handler as unknown as CapgoMediaSessionActionHandler
    ).catch(() => {});
  } else if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      /* ignore */
    }
  }
}