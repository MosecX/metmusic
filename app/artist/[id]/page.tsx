import { notFound } from "next/navigation";
import Image from "next/image";
import { getArtist, getArtistDiscography } from "@/lib/tidal";
import { PlayAllButton } from "@/components/play-button";
import { TrackList } from "@/components/track-row";
import { CardGrid, AlbumCard } from "@/components/cards";
import { IconMusic } from "@/components/icons";

export const metadata = { title: "Artist — musify" };

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let info;
  try {
    info = await getArtist(id);
  } catch {
    notFound();
  }

  const { artist, cover } = info;

  let disc: { albums: Awaited<ReturnType<typeof getArtistDiscography>>["albums"]; tracks: Awaited<ReturnType<typeof getArtistDiscography>>["tracks"] } = {
    albums: [],
    tracks: [],
  };
  try {
    disc = await getArtistDiscography(id);
  } catch {
    /* discography optional */
  }

  const pic = artist.picture
    ? `https://resources.tidal.com/images/${artist.picture.replace(/-/g, "/")}/750x750.jpg`
    : (cover?.["750"] ?? null);

  return (
    <div>
      {/* Header */}
      <div className="glass mb-8 flex flex-col gap-6 rounded-3xl p-6 md:flex-row md:items-end md:gap-8 md:p-8">
        <div className="shrink-0">
          {pic ? (
            <Image
              src={pic}
              alt={artist.name}
              width={240}
              height={240}
              sizes="(max-width: 768px) 192px, 240px"
              className="h-48 w-48 rounded-full object-cover shadow-2xl shadow-black/60 ring-2 ring-white/15 md:h-60 md:w-60"
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-full bg-white/5 text-white/30 md:h-60 md:w-60">
              <IconMusic className="h-16 w-16" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Artist
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            {artist.name}
          </h1>
          <p className="mt-3 text-sm text-white/60">
            {disc.albums.length} releases · {disc.tracks.length} popular tracks
          </p>
          <div className="mt-6">
            <PlayAllButton tracks={disc.tracks} />
          </div>
        </div>
      </div>

      {/* Popular tracks */}
      {disc.tracks.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-white">Popular tracks</h2>
          <TrackList tracks={disc.tracks} />
        </section>
      )}

      {/* Albums */}
      {disc.albums.length > 0 && (
        <CardGrid title="Albums">
          {disc.albums.slice(0, 20).map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </CardGrid>
      )}
    </div>
  );
}
