import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAlbum, checkApiHealth, coverUrl } from "@/lib/tidal";
import { formatDuration } from "@/lib/utils";
import { PlayAllButton } from "@/components/play-button";
import { ShareButton } from "@/components/share-button";
import { TrackList } from "@/components/track-row";
import { Reveal } from "@/components/reveal";
import { IconMusic } from "@/components/icons";
import ApiStatusBanner from "@/components/api-status";

export const metadata = { title: "Album — MetMusic" };

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const health = await checkApiHealth();
  if (!health.online) {
    return <ApiStatusBanner health={health} />;
  }

  let album;
  try {
    album = await getAlbum(id, 300);
  } catch {
    notFound();
  }

  const tracks = album.items.map((i) => i.item);
  const cover = coverUrl(album.cover, 640);
  const artists = album.artists ?? (album.artist ? [album.artist] : []);
  const artistLink = `/artist/${artists[0]?.id ?? ""}`;

  return (
    <div>
      {/* Header */}
      <Reveal>
        <div className="glass mb-8 flex flex-col gap-6 rounded-3xl p-6 md:flex-row md:items-end md:gap-8 md:p-8">
        <div className="shrink-0">
          {cover ? (
            <Image
              src={cover}
              alt={album.title}
              width={240}
              height={240}
              sizes="(max-width: 768px) 192px, 240px"
              className="h-48 w-48 rounded-2xl object-cover shadow-2xl shadow-black/60 ring-1 ring-white/10 md:h-60 md:w-60"
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-white/5 text-white/30 md:h-60 md:w-60">
              <IconMusic className="h-16 w-16" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            {album.type === "EP" ? "EP" : "Album"}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            {album.title}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/60">
            {artists.length > 0 && (
              <Link href={artistLink} className="font-semibold text-white hover:underline">
                {artists.map((a) => a.name).join(", ")}
              </Link>
            )}
            <span>·</span>
            <span>{album.releaseDate?.slice(0, 4)}</span>
            <span>·</span>
            <span>{tracks.length} songs</span>
            {album.duration ? (
              <>
                <span>·</span>
                <span>{formatDuration(album.duration)}</span>
              </>
            ) : null}
          </p>
          <div className="mt-6 flex items-center gap-4">
            <PlayAllButton tracks={tracks} />
            <ShareButton title={`${album.title} by ${artists.map((a) => a.name).join(", ")}`} />
          </div>
        </div>
      </div>
      </Reveal>

      {/* Track list */}
      {tracks.length > 0 && <TrackList tracks={tracks} />}

      {/* About */}
      <div className="glass mt-10 rounded-3xl p-6">
        <h2 className="mb-3 text-lg font-bold text-white">About</h2>
        <p className="text-sm leading-relaxed text-white/50">
          {album.copyright ?? `${album.title} by ${artists.map((a) => a.name).join(", ")}`}
        </p>
        {album.popularity ? (
          <p className="mt-2 text-sm text-white/50">
            Popularity: {album.popularity}
          </p>
        ) : null}
      </div>
    </div>
  );
}
