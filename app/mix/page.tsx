import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import {
  getPlaylist,
  getTrack,
  getMix,
  playlistCoverUrl,
  type TrackMix,
} from "@/lib/tidal";
import { CardGrid, MixCard } from "@/components/cards";
import { PlayAllButton } from "@/components/play-button";
import { TrackList } from "@/components/track-row";
import { IconSparkle } from "@/components/icons";

const MY_MIX_ID = "f6f96110-52ef-4713-9bf1-6438df5c042f";
const SEED_TRACKS = [426214797, 340303122, 1550546, 422281860, 409386866];

async function getMixData() {
  const [myMix, ...seedRes] = await Promise.allSettled([
    getPlaylist(MY_MIX_ID, 50),
    ...SEED_TRACKS.map((id) => getTrack(id)),
  ]);

  const mixIds: string[] = [];
  for (const res of seedRes) {
    if (res.status === "fulfilled" && res.value.mixes?.TRACK_MIX) {
      mixIds.push(res.value.mixes.TRACK_MIX);
    }
  }

  const mixes: TrackMix[] = [];
  const results = await Promise.allSettled([...new Set(mixIds)].map((mid) => getMix(mid, 1)));
  for (const res of results) {
    if (res.status === "fulfilled" && res.value.mix) {
      mixes.push(res.value.mix);
    }
  }

  return {
    myMix: myMix.status === "fulfilled" ? myMix.value : null,
    mixes,
  };
}

export default async function MixPage() {
  const { myMix, mixes } = await getMixData();
  const playlist = myMix?.playlist;
  const tracks = myMix?.items ?? [];
  const cover = playlist ? playlistCoverUrl(playlist, 1280) : null;

  return (
    <div>
      {/* Featured mix */}
      {playlist && (
        <section className="glass relative mb-10 overflow-hidden rounded-3xl">
          {cover && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl"
              style={{ backgroundImage: `url(${cover})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07070b]/80 via-[#07070b]/40 to-transparent" />
          <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-end md:gap-8 md:p-10">
            <div className="shrink-0">
              {cover ? (
                <Image
                  src={cover}
                  alt={playlist.title}
                  width={224}
                  height={224}
                  sizes="(max-width: 768px) 160px, 224px"
                  className="h-40 w-40 rounded-2xl object-cover shadow-2xl shadow-black/60 ring-1 ring-white/10 md:h-56 md:w-56"
                />
              ) : (
                <div className="h-40 w-40 rounded-2xl bg-white/10 md:h-56 md:w-56" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                <IconSparkle className="h-4 w-4 text-amber-400" />
                My Mix
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                {playlist.title}
              </h1>
              {playlist.description && (
                <p className="mt-3 max-w-xl text-sm text-white/60">
                  {playlist.description}
                </p>
              )}
              {typeof playlist.numberOfTracks === "number" && (
                <p className="mt-2 text-sm text-white/50">
                  {playlist.numberOfTracks} tracks
                </p>
              )}
              <div className="mt-6 flex items-center gap-4">
                <PlayAllButton tracks={tracks} />
                <Link
                  href={`/playlist/${playlist.uuid}`}
                  className="glass glass-hover rounded-full px-6 py-3 text-sm font-medium text-white"
                >
                  Open playlist
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured mix tracks */}
      {tracks.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-white">
            {playlist?.title ?? "My Mix"}
          </h2>
          <Suspense fallback={null}>
            <TrackList tracks={tracks} />
          </Suspense>
        </section>
      )}

      {/* Real mixes */}
      {mixes.length > 0 && (
        <Suspense fallback={null}>
          <CardGrid title="More mixes">
            {mixes.slice(0, 10).map((mix) => (
              <MixCard key={mix.id} mix={mix} />
            ))}
          </CardGrid>
        </Suspense>
      )}
    </div>
  );
}
