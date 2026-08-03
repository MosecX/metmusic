import { notFound } from "next/navigation";
import Image from "next/image";
import { getMix, mixImageUrl, checkApiHealth } from "@/lib/tidal";
import { formatDuration } from "@/lib/utils";
import { PlayAllButton } from "@/components/play-button";
import { ShareButton } from "@/components/share-button";
import { TrackList } from "@/components/track-row";
import { IconSparkle } from "@/components/icons";
import ApiStatusBanner from "@/components/api-status";

export const metadata = { title: "Mix — MetMusic" };

export default async function MixDetailPage({
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
    data = await getMix(id, 300);
  } catch {
    notFound();
  }

  const { mix, items } = data;
  if (!mix) notFound();

  const cover = mixImageUrl(mix, "LARGE");

  return (
    <div>
      <div className="glass mb-8 flex flex-col gap-6 rounded-3xl p-6 md:flex-row md:items-end md:gap-8 md:p-8">
        <div className="shrink-0">
          {cover ? (
            <Image
              src={cover}
              alt={mix.title}
              width={240}
              height={240}
              sizes="(max-width: 768px) 192px, 240px"
              className="h-48 w-48 rounded-2xl object-cover shadow-2xl shadow-black/60 ring-1 ring-white/10 md:h-60 md:w-60"
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-white/5 text-white/30 md:h-60 md:w-60">
              <IconSparkle className="h-16 w-16" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50">
            <IconSparkle className="h-4 w-4 text-amber-400" />
            Mix
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            {mix.title}
          </h1>
          {mix.subTitle && (
            <p className="mt-2 text-sm text-white/60">{mix.subTitle}</p>
          )}
          {mix.description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
              {mix.description}
            </p>
          )}
          <p className="mt-3 text-sm text-white/60">
            {items.length} songs
            {items.reduce((sum, t) => sum + (t.duration || 0), 0) > 0
              ? ` · ${formatDuration(items.reduce((sum, t) => sum + (t.duration || 0), 0))}`
              : ""}
          </p>
          <div className="mt-6 flex items-center gap-4">
            <PlayAllButton tracks={items} />
            <ShareButton title={mix.title} />
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <TrackList tracks={items} />
      ) : (
        <p className="py-10 text-center text-sm text-white/40">
          This mix has no playable tracks.
        </p>
      )}
    </div>
  );
}
