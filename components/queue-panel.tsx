"use client";

import Image from "next/image";
import { usePlayer } from "@/components/player";
import { coverUrl, trackArtists } from "@/lib/tidal";
import { IconClose, IconMusic } from "@/components/icons";

export function QueuePanel({
  onClose,
  className = "",
}: {
  onClose?: () => void;
  className?: string;
}) {
  const { queue, currentIndex, jumpTo, removeFromQueue } = usePlayer();

  if (!queue.length) {
    return (
      <p className="px-4 py-8 text-center text-sm text-white/40">
        Queue is empty — play something to fill it.
      </p>
    );
  }

  return (
    <div
      aria-label="Queue panel"
      className={`flex flex-col overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-2.5">
        <h3 className="text-sm font-bold text-white">
          Up next · {queue.length} track{queue.length === 1 ? "" : "s"}
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close queue"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <IconClose className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="max-h-[55vh] overflow-y-auto px-2 pb-2">
        {queue.map((t, i) => {
          const isCurrent = i === currentIndex;
          const cover = coverUrl(t.album?.cover, 160);
          return (
            <div
              key={`${t.id}-${i}`}
              className={`flex items-center gap-3 rounded-xl px-2 py-1.5 ${
                isCurrent ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <button
                type="button"
                onClick={() => jumpTo(i)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                {cover ? (
                  <Image
                    src={cover}
                    alt=""
                    width={40}
                    height={40}
                    sizes="40px"
                    className="h-10 w-10 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/5 text-white/40">
                    <IconMusic className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm ${
                      isCurrent ? "font-medium text-sky-400" : "text-white"
                    }`}
                  >
                    {t.title}
                  </p>
                  <p className="truncate text-xs text-white/50">
                    {isCurrent ? "Now playing" : trackArtists(t)}
                  </p>
                </div>
              </button>
              {!isCurrent && (
                <button
                  type="button"
                  onClick={() => removeFromQueue(i)}
                  aria-label={`Remove ${t.title} from queue`}
                  title="Remove from queue"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
