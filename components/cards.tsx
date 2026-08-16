"use client";

import Link from "next/link";
import Image from "next/image";
import type { AlbumLite, ArtistLite, TrackMix } from "@/lib/tidal";
import { coverUrl, pictureUrl, mixImageUrl } from "@/lib/tidal";
import { albumBadges, albumTypeLabel } from "@/lib/utils";
import { IconAtmos, IconDots, IconMusic, IconSparkle } from "@/components/icons";
import { ContextMenu, shareItem, useContextMenu } from "@/components/context-menu";

const CARD_SIZES =
  "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, (max-width: 1536px) 16vw, 14vw";

export function AlbumCard({ album, size = 220 }: { album: AlbumLite; size?: number }) {
  const src = coverUrl(album.cover, 640);
  const artist = album.artists?.[0]?.name ?? "Album";
  const { menu, openAt, openFromEvent, close } = useContextMenu();
  const menuItems = [shareItem(album.title, `/album/${album.id}`)];
  return (
    <>
      <Link
        href={`/album/${album.id}`}
        onContextMenu={openFromEvent}
        className="glass-card card-lift group flex w-full min-w-0 flex-col rounded-2xl p-3"
        style={{ maxWidth: size }}
      >
        <div className="relative mb-3 aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-white/5">
          <span aria-hidden className="shine" />
          {src ? (
            <Image
              src={src}
              alt={album.title}
              fill
              sizes={CARD_SIZES}
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/30">
              <IconMusic className="h-12 w-12" />
            </div>
          )}
          {album.type && albumTypeLabel(album.type) && (
            <span className="absolute left-2 top-2 z-10 rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/80 backdrop-blur-md">
              {albumTypeLabel(album.type)}
            </span>
          )}
          {albumBadges(album).map((b) => (
            <span
              key={b.label}
              className={`absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide backdrop-blur-md ${b.cls} ${
                album.type && albumTypeLabel(album.type) ? "top-9" : ""
              }`}
            >
              {b.label === "ATMOS" && <IconAtmos className="h-2.5 w-2.5" />}
              {b.label === "HI-RES" && <IconSparkle className="h-2.5 w-2.5" />}
              {b.label !== "ATMOS" && b.label !== "HI-RES" ? (
                <span className="h-1 w-1 rounded-full bg-current opacity-60" />
              ) : null}
              {b.label}
            </span>
          ))}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              openAt(rect.right, rect.bottom);
            }}
            aria-label="More options"
            title="More options"
            className="absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <IconDots className="h-5 w-5" />
          </button>
        </div>
        <h3 className="truncate text-sm font-semibold text-white">{album.title}</h3>
        <p className="truncate text-xs text-white/50">{artist}</p>
      </Link>
      <ContextMenu menu={menu} items={menuItems} onClose={close} />
    </>
  );
}

export function DiscographyCard({ album, size = 220 }: { album: AlbumLite; size?: number }) {
  const src = coverUrl(album.cover, 640);
  const { menu, openAt, openFromEvent, close } = useContextMenu();
  const menuItems = [shareItem(album.title, `/album/${album.id}`)];
  const year = album.releaseDate ? new Date(album.releaseDate).getUTCFullYear() : null;
  return (
    <>
      <Link
        href={`/album/${album.id}`}
        onContextMenu={openFromEvent}
        className="glass-card card-lift group flex w-full min-w-0 flex-col rounded-2xl p-3"
        style={{ maxWidth: size }}
      >
        <div className="relative mb-3 aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-white/5">
          <span aria-hidden className="shine" />
          {src ? (
            <Image
              src={src}
              alt={album.title}
              fill
              sizes={CARD_SIZES}
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/30">
              <IconMusic className="h-12 w-12" />
            </div>
          )}
          {album.type && albumTypeLabel(album.type) && (
            <span className="absolute left-2 top-2 z-10 rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/80 backdrop-blur-md">
              {albumTypeLabel(album.type)}
            </span>
          )}
          {albumBadges(album).map((b) => (
            <span
              key={b.label}
              className={`absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide backdrop-blur-md ${b.cls}`}
            >
              {b.label === "ATMOS" && <IconAtmos className="h-2.5 w-2.5" />}
              {b.label === "HI-RES" && <IconSparkle className="h-2.5 w-2.5" />}
              {b.label !== "ATMOS" && b.label !== "HI-RES" ? (
                <span className="h-1 w-1 rounded-full bg-current opacity-60" />
              ) : null}
              {b.label}
            </span>
          ))}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              openAt(rect.right, rect.bottom);
            }}
            aria-label="More options"
            title="More options"
            className="absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <IconDots className="h-5 w-5" />
          </button>
        </div>
        <h3 className="truncate text-sm font-semibold text-white">{album.title}</h3>
        <p className="truncate text-xs text-white/50">
          {[albumTypeLabel(album.type), year, album.numberOfTracks ? `${album.numberOfTracks} tracks` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </Link>
      <ContextMenu menu={menu} items={menuItems} onClose={close} />
    </>
  );
}

export function MixCard({ mix, size = 220 }: { mix: TrackMix; size?: number }) {
  const src = mixImageUrl(mix, "MEDIUM");
  const { menu, openAt, openFromEvent, close } = useContextMenu();
  const menuItems = [shareItem(mix.title, `/mix/${mix.id}`)];
  return (
    <>
      <Link
        href={`/mix/${mix.id}`}
        onContextMenu={openFromEvent}
        className="glass-card card-lift group flex w-full min-w-0 flex-col rounded-2xl p-3"
        style={{ maxWidth: size }}
      >
        <div className="relative mb-3 aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-white/5">
          <span aria-hidden className="shine" />
          {src ? (
            <Image
              src={src}
              alt={mix.title}
              fill
              sizes={CARD_SIZES}
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/30">
              <IconSparkle className="h-12 w-12" />
            </div>
          )}
          <span className="absolute right-2 top-2 z-10 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white/80 backdrop-blur-md">
            Mix
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              openAt(rect.right, rect.bottom);
            }}
            aria-label="More options"
            title="More options"
            className="absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <IconDots className="h-5 w-5" />
          </button>
        </div>
        <h3 className="truncate text-sm font-semibold text-white">{mix.title}</h3>
        {mix.subTitle && (
          <p className="mt-1 truncate text-xs text-white/50">{mix.subTitle}</p>
        )}
      </Link>
      <ContextMenu menu={menu} items={menuItems} onClose={close} />
    </>
  );
}

export function ArtistCard({ artist, size = 220 }: { artist: ArtistLite; size?: number }) {
  const src = pictureUrl(artist.picture, 1080);
  return (
    <Link
      href={`/artist/${artist.id}`}
      className="glass-card card-lift group flex w-full min-w-0 flex-col rounded-2xl p-3"
      style={{ maxWidth: size }}
    >
      <div className="relative mb-3 aspect-square w-full shrink-0 overflow-hidden rounded-full bg-white/5">
        <span aria-hidden className="shine" />
        {src ? (
          <Image
            src={src}
            alt={artist.name}
            fill
            sizes={CARD_SIZES}
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/30">
            <IconMusic className="h-12 w-12" />
          </div>
        )}
      </div>
      <h3 className="truncate text-center text-sm font-semibold text-white">
        {artist.name}
      </h3>
    </Link>
  );
}

export function CardGrid({
  children,
  title,
  href,
}: {
  children: React.ReactNode;
  title?: string;
  href?: string;
}) {
  return (
    <section className="mb-10">
      {title && (
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {href && (
            <Link href={href} className="text-xs font-medium text-white/50 hover:text-white">
              See all
            </Link>
          )}
        </div>
      )}
      <div className="stagger-fade grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8">
        {children}
      </div>
    </section>
  );
}
