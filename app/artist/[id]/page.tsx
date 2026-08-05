import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getArtist,
  getArtistDiscography,
  checkApiHealth,
  type AlbumLite,
} from "@/lib/tidal";
import { albumBadges } from "@/lib/utils";
import { PlayAllButton } from "@/components/play-button";
import { TrackList } from "@/components/track-row";
import { CardGrid, DiscographyCard } from "@/components/cards";
import { IconAtmos, IconMusic, IconSparkle } from "@/components/icons";
import ApiStatusBanner from "@/components/api-status";

export const metadata = { title: "Artist — MetMusic" };

function qualityCounts(albums: AlbumLite[]) {
  let atmos = 0;
  let hiRes = 0;
  let lossless = 0;
  for (const a of albums) {
    const badges = albumBadges(a).map((b) => b.label);
    if (badges.includes("ATMOS")) atmos++;
    if (badges.includes("HI-RES")) hiRes++;
    if (badges.includes("LOSSLESS") || (a.audioQuality ?? "").toUpperCase() === "LOSSLESS")
      lossless++;
  }
  return { atmos, hiRes, lossless };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artistId = Number(id);

  const health = await checkApiHealth();
  if (!health.online) {
    return <ApiStatusBanner health={health} />;
  }

  let info;
  try {
    info = await getArtist(id);
  } catch {
    notFound();
  }

  const { artist, cover } = info;

  let disc: Awaited<ReturnType<typeof getArtistDiscography>> = {
    albums: [],
    tracks: [],
  };
  try {
    disc = await getArtistDiscography(id);
  } catch {
    /* discography optional */
  }

  const ownAlbums = disc.albums.filter(
    (a) => a.artist?.id === artistId || a.artists?.[0]?.id === artistId
  );
  const featured = disc.albums.filter(
    (a) => !ownAlbums.includes(a) && a.artists?.some((x) => x.id === artistId)
  );

  const albums = ownAlbums
    .filter((a) => a.type === "ALBUM")
    .sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
  const singles = ownAlbums
    .filter((a) => a.type !== "ALBUM")
    .sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));

  const popularTracks = [...disc.tracks]
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 10);

  const counts = qualityCounts(ownAlbums);
  const accent =
    [...ownAlbums]
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .find((a) => a.vibrantColor)?.vibrantColor ?? "#22d3ee";

  const pic = artist.picture
    ? `https://resources.tidal.com/images/${artist.picture.replace(/-/g, "/")}/750x750.jpg`
    : (cover?.["750"] ?? null);

  return (
    <div className="fade-up">
      {/* Header */}
      <div
        className="glass relative mb-8 overflow-hidden rounded-3xl p-6 md:p-8"
        style={
          {
            "--accent": accent,
          } as React.CSSProperties
        }
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(55% 80% at 20% 15%, color-mix(in srgb, var(--accent) 28%, transparent), transparent 70%)`,
          }}
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
          <div className="shrink-0">
            {pic ? (
              <Image
                src={pic}
                alt={artist.name}
                width={240}
                height={240}
                sizes="(max-width: 768px) 192px, 240px"
                className="float-slow h-48 w-48 rounded-full object-cover shadow-2xl shadow-black/60 ring-2 ring-white/15 md:h-60 md:w-60"
              />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-full bg-white/5 text-white/30 md:h-60 md:w-60">
                <IconMusic className="h-16 w-16" />
              </div>
            )}
          </div>
          <div className="hero-stagger min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
              Artist
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              {artist.name}
            </h1>
            <p className="mt-3 text-sm text-white/60">
              {ownAlbums.length} releases · {disc.tracks.length} tracks
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {counts.hiRes > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300/60 bg-gradient-to-r from-yellow-400/25 via-amber-300/20 to-yellow-400/25 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.35)]">
                  <IconSparkle className="h-3 w-3" />
                  Hi-Res {counts.hiRes}
                </span>
              )}
              {counts.atmos > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/50 bg-cyan-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.35)]">
                  <IconAtmos className="h-3 w-3" />
                  Dolby Atmos {counts.atmos}
                </span>
              )}
              {counts.lossless > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/50">
                  Lossless {counts.lossless}
                </span>
              )}
            </div>

            <div className="mt-6">
              <PlayAllButton tracks={popularTracks} />
            </div>
          </div>
        </div>
      </div>

      {/* Popular tracks */}
      {popularTracks.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-white">Popular tracks</h2>
          <TrackList tracks={popularTracks} />
        </section>
      )}

      {/* Albums */}
      {albums.length > 0 && (
        <CardGrid title={`Albums (${albums.length})`}>
          {albums.map((album) => (
            <DiscographyCard key={album.id} album={album} />
          ))}
        </CardGrid>
      )}

      {/* Singles & EPs */}
      {singles.length > 0 && (
        <CardGrid title={`Singles & EPs (${singles.length})`}>
          {singles.map((album) => (
            <DiscographyCard key={album.id} album={album} />
          ))}
        </CardGrid>
      )}

      {/* Appears on */}
      {featured.length > 0 && (
        <CardGrid title={`Appears on (${featured.length})`}>
          {featured.map((album) => (
            <DiscographyCard key={album.id} album={album} />
          ))}
        </CardGrid>
      )}
    </div>
  );
}
