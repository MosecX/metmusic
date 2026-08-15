import { Suspense } from "react";
import { searchArtists, searchAlbums, searchTracks } from "@/lib/tidal";
import { SearchBox } from "@/components/search-box";
import { TrackList } from "@/components/track-row";
import { CardGrid, AlbumCard, ArtistCard } from "@/components/cards";
import ApiStatusBanner from "@/components/api-status";

export const metadata = { title: "Search — MetMusic" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const query = Array.isArray(q) ? q[0] : (q ?? "");

  return (
    <div className="fade-up">
      <ApiStatusBanner />
      <h1 className="mb-5 text-2xl font-bold text-white">Search</h1>
      <SearchBox initial={query} autoFocus className="mb-8 max-w-xl" />

      {!query.trim() && (
        <div className="py-16 text-center text-white/40">
          <p className="text-lg">Type to search across tracks, albums and artists.</p>
        </div>
      )}

      {query.trim() && (
        <Suspense
          fallback={
            <div className="py-16 text-center text-sm text-white/40">Searching…</div>
          }
        >
          <SearchResults query={query.trim()} />
        </Suspense>
      )}
    </div>
  );
}

async function SearchResults({ query }: { query: string }) {
  const [tracks, albums, artists] = await Promise.allSettled([
    searchTracks(query, 24),
    searchAlbums(query, 12),
    searchArtists(query, 12),
  ]);

  const trackItems = tracks.status === "fulfilled" ? tracks.value : [];
  const albumItems = albums.status === "fulfilled" ? albums.value : [];
  const artistItems = artists.status === "fulfilled" ? artists.value : [];

  const empty = !trackItems.length && !albumItems.length && !artistItems.length;

  if (empty) {
    return (
      <div className="py-16 text-center text-white/40">
        <p className="text-lg">No results for “{query}”.</p>
        <p className="mt-1 text-sm">Try a different artist or song name.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {trackItems.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-white">Tracks</h2>
          <TrackList tracks={trackItems} />
        </section>
      )}

      {albumItems.length > 0 && (
        <CardGrid title="Albums">
          {albumItems.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </CardGrid>
      )}

      {artistItems.length > 0 && (
        <CardGrid title="Artists">
          {artistItems.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </CardGrid>
      )}
    </div>
  );
}
