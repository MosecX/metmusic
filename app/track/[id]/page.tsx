import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLyrics, getRecommendations, getTrack, checkApiHealth, coverUrl, trackArtists } from "@/lib/tidal";
import { formatDuration, formatDate, isAtmos } from "@/lib/utils";
import { PlayAllButton } from "@/components/play-button";
import { ShareButton } from "@/components/share-button";
import { LyricsPreview } from "@/components/lyrics-preview";
import { TrackList } from "@/components/track-row";
import { AtmosBadge } from "@/components/quality-badge";
import { Reveal } from "@/components/reveal";
import { IconMusic } from "@/components/icons";
import ApiStatusBanner from "@/components/api-status";

export const metadata = { title: "Track — MetMusic" };

export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const health = await checkApiHealth();
  if (!health.online) {
    return <ApiStatusBanner health={health} />;
  }

  let track;
  try {
    track = await getTrack(id);
  } catch {
    notFound();
  }

  const [recs, lyrics] = await Promise.allSettled([
    getRecommendations(track.id, 12),
    getLyrics(track.id),
  ]);

  const recTracks = recs.status === "fulfilled" ? recs.value : [];
  const lyricsData = lyrics.status === "fulfilled" ? lyrics.value : null;
  const cover = coverUrl(track.album?.cover, 640);
  const albumLink = `/album/${track.album?.id ?? ""}`;
  const artistLink = `/artist/${track.artist?.id ?? track.artists?.[0]?.id ?? ""}`;

  return (
    <div className="fade-up">
      {/* Header */}
      <div className="glass mb-8 flex flex-col gap-6 rounded-3xl p-6 md:flex-row md:items-end md:gap-8 md:p-8">
        <div className="shrink-0">
          {cover ? (
            <Image
              src={cover}
              alt={track.title}
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
            {track.explicit ? "Explicit · " : ""}Track
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            {track.title}
            {track.version ? (
              <span className="text-lg font-medium text-white/50"> — {track.version}</span>
            ) : null}
          </h1>
          <p className="mt-3 text-sm text-white/60">
            <Link href={artistLink} className="font-semibold text-white hover:underline">
              {trackArtists(track)}
            </Link>
            {track.album?.title && (
              <>
                {" · "}
                <Link href={albumLink} className="text-white/80 hover:text-white hover:underline">
                  {track.album.title}
                </Link>
              </>
            )}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
            {track.audioQuality && <span>{track.audioQuality.replace(/_/g, " ")}</span>}
            {isAtmos(track) && <AtmosBadge />}
            {track.bpm ? <span>{track.bpm} BPM</span> : null}
            {track.key ? <span>Key of {track.key} {track.keyScale}</span> : null}
            <span>{formatDuration(track.duration)}</span>
            {track.isrc ? <span>ISRC {track.isrc}</span> : null}
          </div>
          <div className="mt-6 flex items-center gap-4">
            <PlayAllButton tracks={[track]} />
            <ShareButton title={track.title} />
          </div>
        </div>
      </div>

      {/* Lyrics preview */}
      {lyricsData?.text && (
        <Reveal>
          <section className="mb-10">
            <h2 className="mb-3 text-xl font-bold text-white">Lyrics</h2>
            <LyricsPreview text={lyricsData.text} />
          </section>
        </Reveal>
      )}

      {/* About */}
      {track.album?.title && (
        <Reveal>
          <section className="mb-10">
            <h2 className="mb-3 text-xl font-bold text-white">About this track</h2>
            <div className="glass-soft rounded-2xl p-6 text-sm text-white/60">
            <p>
              <span className="text-white/80">Track:</span> {track.title}
            </p>
            <p>
              <span className="text-white/80">Album:</span>{" "}
              <Link href={albumLink} className="hover:text-white hover:underline">
                {track.album.title}
              </Link>
            </p>
            <p>
              <span className="text-white/80">Release:</span> {formatDate(track.streamStartDate)}
            </p>
            {track.popularity ? (
              <p>
                <span className="text-white/80">Popularity:</span> {track.popularity}
              </p>
            ) : null}
            {track.isrc ? (
              <p>
                <span className="text-white/80">ISRC:</span> {track.isrc}
              </p>
            ) : null}
            </div>
          </section>
        </Reveal>
      )}

      {/* Recommendations */}
      {recTracks.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-white">Similar tracks</h2>
          <TrackList tracks={recTracks} />
        </section>
      )}
    </div>
  );
}
