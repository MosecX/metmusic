import { notFound } from "next/navigation";
import Image from "next/image";
import { getPlaylist, playlistCoverUrl, checkApiHealth } from "@/lib/tidal";
import { formatDuration } from "@/lib/utils";
import { PlayAllButton } from "@/components/play-button";
import { TrackList } from "@/components/track-row";
import { IconMusic } from "@/components/icons";
import ApiStatusBanner from "@/components/api-status";

export const metadata = { title: "Playlist — MetMusic" };

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const health = await checkApiHealth();
  if (!health.online) {
    return <ApiStatusBanner health={health} />;
  }

  let data;
  try {
    data = await getPlaylist(id, 300);
  } catch {
    notFound();
  }

  const { playlist, items } = data;
  const cover = playlistCoverUrl(playlist, 640);

  return (
    <div className="fade-up">
      <div className="glass mb-8 flex flex-col gap-6 rounded-3xl p-6 md:flex-row md:items-end md:gap-8 md:p-8">
        <div className="shrink-0">
          {cover ? (
            <Image
              src={cover}
              alt={playlist.title}
              width={240}
              height={240}
              sizes="(max-width: 768px) 192px, 240px"
              className="float-slow h-48 w-48 rounded-2xl object-cover shadow-2xl shadow-black/60 ring-1 ring-white/10 md:h-60 md:w-60"
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
            {playlist.title}
          </h1>
          {playlist.description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
              {playlist.description}
            </p>
          )}
          <p className="mt-3 text-sm text-white/60">
            {items.length} songs
            {playlist.duration ? ` · ${formatDuration(playlist.duration)}` : ""}
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
    </div>
  );
}
