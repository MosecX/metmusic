import Link from "next/link";
import Image from "next/image";
import { searchPlaylists, playlistCoverUrl } from "@/lib/tidal";
import { IconMusic } from "@/components/icons";
import ApiStatusBanner from "@/components/api-status";

export const metadata = { title: "Library — MetMusic" };

const CATEGORIES = [
  { label: "Hits", q: "hits" },
  { label: "Latin", q: "latin" },
  { label: "Electronic", q: "electronic" },
  { label: "Rock", q: "rock" },
  { label: "Jazz", q: "jazz" },
  { label: "Chill", q: "chill" },
];

export default async function LibraryPage() {
  const results = await Promise.allSettled(
    CATEGORIES.map((c) => searchPlaylists(c.q, 6))
  );

  return (
    <div className="fade-up">
      <ApiStatusBanner />
      <h1 className="mb-8 text-2xl font-bold text-white">Browse playlists</h1>

      {CATEGORIES.map((cat, idx) => {
        const res = results[idx];
        const playlists = res.status === "fulfilled" ? res.value : [];
        if (!playlists.length) return null;
        return (
          <section key={cat.q} className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-white">{cat.label}</h2>
            <div className="stagger-fade grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {playlists.map((pl) => {
                const src = playlistCoverUrl(pl, 640);
                return (
                  <Link
                    key={pl.uuid}
                    href={`/playlist/${pl.uuid}`}
                    className="glass-card card-lift group flex w-full min-w-0 flex-col rounded-2xl p-3"
                  >
                    <div className="relative mb-3 aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-white/5">
                      <span aria-hidden className="shine" />
                      {src ? (
                        <Image
                          src={src}
                          alt={pl.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white/30">
                          <IconMusic className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    <h3 className="truncate text-sm font-semibold text-white">
                      {pl.title}
                    </h3>
                    <p className="truncate text-xs text-white/50">
                      {pl.numberOfTracks ?? 0} tracks
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
