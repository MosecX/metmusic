import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { Suspense } from "react";
import {
  getAlbum,
  getRecommendations,
  getTrack,
  searchAlbums,
  artworkUrl,
  coverUrl,
  trackArtists,
  type AlbumLite,
  type Track,
} from "@/lib/tidal";
import { CardGrid, AlbumCard } from "@/components/cards";
import { PlayAllButton } from "@/components/play-button";
import { TrackList } from "@/components/track-row";
import { IconPlay } from "@/components/icons";
import ApiStatusBanner from "@/components/api-status";

const SEED_TRACKS = [
  426214797, 426651227, 436445459, 426178440, 424801149, 422281860,
  380058874, 424468149, 437775283, 436206991, 415829263, 429540378,
  422096216, 300692914, 1550546, 409386866,
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function getLastPlayedId(): Promise<number | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("last_played")?.value;
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function getHomeData() {
  const historySeed = await getLastPlayedId();
  const seed = historySeed ?? pickRandom(SEED_TRACKS);

  const [recs, electronic, hiphop, rock, fallbackTrack] = await Promise.allSettled([
    getRecommendations(seed, 24),
    searchAlbums("electronic", 10),
    searchAlbums("hip hop", 10),
    searchAlbums("rock", 10),
    getTrack(seed),
  ]);

  const recList = recs.status === "fulfilled" ? recs.value : [];

  let heroTrack: Track | null = null;
  if (recList.length) {
    heroTrack = pickRandom(recList);
  } else if (fallbackTrack.status === "fulfilled") {
    heroTrack = fallbackTrack.value;
  }

  let heroAlbum: Awaited<ReturnType<typeof getAlbum>> | null = null;
  if (heroTrack?.album?.id) {
    const res = await Promise.allSettled([getAlbum(heroTrack.album.id, 20)]);
    heroAlbum = res[0].status === "fulfilled" ? res[0].value : null;
  }

  return {
    heroTrack,
    heroAlbum,
    recs: recList,
    electronic: electronic.status === "fulfilled" ? electronic.value : [],
    hiphop: hiphop.status === "fulfilled" ? hiphop.value : [],
    rock: rock.status === "fulfilled" ? rock.value : [],
  };
}

export default async function HomePage() {
  const data = await getHomeData();
  const { heroTrack, heroAlbum, recs } = data;

  const featuredTracks: Track[] = [];
  const heroCover = heroAlbum?.cover ? coverUrl(heroAlbum.cover, 1280) : null;
  if (heroAlbum?.items) {
    featuredTracks.push(...heroAlbum.items.map((i) => i.item));
  }

  return (
    <div className="fade-up">
      <ApiStatusBanner />

      {/* Hero */}
      {heroTrack && (
        <section className="glass relative mb-10 overflow-hidden rounded-3xl">
          {heroCover && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl max-lg:blur-lg"
              style={{ backgroundImage: `url(${artworkUrl(heroCover)})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07070b]/80 via-[#07070b]/40 to-transparent" />
          <div className="hero-stagger relative flex flex-col gap-6 p-6 md:flex-row md:items-end md:gap-8 md:p-10">
            <div className="shrink-0">
              {heroCover ? (
                <Image
                  src={heroCover}
                  alt={heroAlbum?.title ?? ""}
                  width={224}
                  height={224}
                  priority
                  sizes="(max-width: 768px) 160px, 224px"
                  className="float-slow h-40 w-40 rounded-2xl object-cover shadow-2xl shadow-black/60 ring-1 ring-white/10 md:h-56 md:w-56"
                />
              ) : (
                <div className="h-40 w-40 rounded-2xl bg-white/10 md:h-56 md:w-56" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                Featured album
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                {heroAlbum?.title ?? heroTrack.title}
              </h1>
              <p className="mt-3 text-sm text-white/60">
                {heroAlbum?.artists?.[0]?.name ?? trackArtists(heroTrack)} ·{" "}
                {heroAlbum?.releaseDate?.slice(0, 4)}
              </p>
              <div className="mt-6 flex items-center gap-4">
                <PlayAllButton tracks={featuredTracks.length ? featuredTracks : [heroTrack]} />
                {featuredTracks.length > 0 && (
                  <Link
                    href={`/album/${heroAlbum?.id}`}
                    className="glass glass-hover rounded-full px-6 py-3 text-sm font-medium text-white"
                  >
                    Open album
                  </Link>
                )}
              </div>
            </div>
            </div>
          </section>
      )}

      {/* Recommended tracks */}
      {recs.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-white">Recommended for you</h2>
          <Suspense fallback={null}>
            <TrackList tracks={recs.slice(0, 10)} />
          </Suspense>
        </section>
      )}

      {/* Album sections */}
      <Suspense fallback={null}>
        <AlbumSection title="Electronic" albums={data.electronic} />
        <AlbumSection title="Hip-Hop" albums={data.hiphop} />
        <AlbumSection title="Rock" albums={data.rock} />
      </Suspense>

      {/* Featured album inline player */}
      {featuredTracks.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {heroAlbum?.title ?? "Featured tracks"}
            </h2>
            <Link
              href={`/album/${heroAlbum?.id}`}
              className="flex items-center gap-2 text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              <IconPlay className="h-4 w-4" />
              Play album
            </Link>
          </div>
          <Suspense fallback={null}>
            <TrackList tracks={featuredTracks} />
          </Suspense>
        </section>
      )}
    </div>
  );
}

async function AlbumSection({ title, albums }: { title: string; albums: AlbumLite[] }) {
  if (!albums.length) return null;
  return (
    <CardGrid title={title}>
      {albums.slice(0, 10).map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </CardGrid>
  );
}
