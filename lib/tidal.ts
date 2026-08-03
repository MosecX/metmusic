export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export function requireApiBase(): string {
  if (!API_BASE) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE is not set. Copy .env.example to .env and fill it in."
    );
  }
  return API_BASE;
}

export const IMAGE_BASE = "https://resources.tidal.com/images";

export interface ArtistLite {
  id: number;
  name: string;
  type?: string;
  picture?: string | null;
}

export interface AlbumLite {
  id: number;
  title: string;
  cover?: string | null;
  vibrantColor?: string | null;
  artists?: ArtistLite[] | null;
  artist?: ArtistLite | null;
  releaseDate?: string;
  numberOfTracks?: number;
  audioQuality?: string;
}

export interface Track {
  id: number;
  title: string;
  duration: number;
  explicit?: boolean;
  audioQuality?: string;
  version?: string | null;
  trackNumber?: number;
  volumeNumber?: number;
  popularity?: number;
  isrc?: string;
  bpm?: number;
  key?: string;
  keyScale?: string;
  streamStartDate?: string;
  artist?: ArtistLite | null;
  artists?: ArtistLite[] | null;
  album?: AlbumLite | null;
  url?: string;
  audioModes?: string[];
  mediaMetadata?: { tags?: string[] | string | null } | null;
  mixes?: { TRACK_MIX?: string } | null;
}

export interface Album extends AlbumLite {
  type?: string;
  duration?: number;
  numberOfVolumes?: number;
  numberOfVideos?: number;
  releaseDate?: string;
  copyright?: string;
  upc?: string;
  popularity?: number;
  explicit?: boolean;
  audioQuality?: string;
  items: { item: Track; type?: string }[];
}

export interface Playlist {
  uuid: string;
  title: string;
  description?: string | null;
  numberOfTracks?: number;
  duration?: number;
  created?: string;
  type?: string;
  image?: string | null;
  squareImage?: string | null;
  user?: { id: number; username: string } | null;
}

export interface TrackMix {
  id: string;
  title: string;
  subTitle?: string | null;
  description?: string | null;
  mixType?: string;
  images?: Record<string, { width?: number; height?: number; url: string }>;
  detailImages?: Record<string, { width?: number; height?: number; url: string }>;
}

export function mixImageUrl(
  mix: Pick<TrackMix, "images" | "detailImages"> | null | undefined,
  size: "SMALL" | "MEDIUM" | "LARGE" = "LARGE"
): string | null {
  return (
    mix?.images?.[size]?.url ??
    mix?.detailImages?.[size]?.url ??
    mix?.images?.SMALL?.url ??
    null
  );
}

export function playlistCoverUrl(
  playlist: Pick<Playlist, "image" | "squareImage">,
  size = 640
): string | null {
  return coverUrl(playlist.squareImage ?? playlist.image, size);
}

export function coverUrl(
  cover: string | null | undefined,
  size = 640
): string | null {
  if (!cover) return null;
  return `${IMAGE_BASE}/${cover.replace(/-/g, "/")}/${size}x${size}.jpg`;
}

export function pictureUrl(
  picture: string | null | undefined,
  size = 750
): string | null {
  if (!picture) return null;
  return `${IMAGE_BASE}/${picture.replace(/-/g, "/")}/${size}x${size}.jpg`;
}

export function trackArtists(track: Track): string {
  const list = track.artists ?? (track.artist ? [track.artist] : []);
  return list.map((a) => a.name).join(", ");
}

export interface ApiError {
  detail?: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${requireApiBase()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let detail = `API error ${res.status}`;
    try {
      const body = (await res.json()) as ApiError;
      if (body?.detail) detail = String(body.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  return (await res.json()) as T;
}

export async function searchTracks(
  query: string,
  limit = 24
): Promise<Track[]> {
  const data = await apiFetch<{ data: { items?: Track[] } }>(
    `/search/?s=${encodeURIComponent(query)}&limit=${limit}`
  );
  return data.data?.items ?? [];
}

export async function searchAlbums(
  query: string,
  limit = 12
): Promise<AlbumLite[]> {
  const data = await apiFetch<{ data: { albums?: { items?: AlbumLite[] } } }>(
    `/search/?al=${encodeURIComponent(query)}&limit=${limit}`
  );
  return data.data?.albums?.items ?? [];
}

export async function searchArtists(
  query: string,
  limit = 12
): Promise<ArtistLite[]> {
  const data = await apiFetch<{ data: { artists?: { items?: ArtistLite[] } } }>(
    `/search/?a=${encodeURIComponent(query)}&limit=${limit}`
  );
  return data.data?.artists?.items ?? [];
}

export async function getTrack(id: string | number): Promise<Track> {
  const data = await apiFetch<{ data: Track }>(`/info/?id=${id}`);
  return data.data;
}

export async function getAlbum(
  id: string | number,
  limit = 300
): Promise<Album> {
  const data = await apiFetch<{ data: Album }>(
    `/album/?id=${id}&limit=${limit}`
  );
  return data.data;
}

export async function getArtist(id: string | number): Promise<{
  artist: ArtistLite;
  cover: { id?: number; name?: string; 750?: string } | null;
}> {
  const data = await apiFetch<{
    artist?: ArtistLite | null;
    cover?: { id?: number; name?: string; 750?: string } | null;
  }>(`/artist/?id=${id}`);
  const artist = data.artist ?? { id: Number(id), name: "Artist" };
  return { artist, cover: data.cover ?? null };
}

export async function getArtistDiscography(
  id: string | number
): Promise<{ albums: AlbumLite[]; tracks: Track[] }> {
  const data = await apiFetch<{
    albums?: { items?: AlbumLite[] };
    tracks?: Track[];
  }>(`/artist/?f=${id}&skip_tracks=true`);
  return {
    albums: data.albums?.items ?? [],
    tracks: data.tracks ?? [],
  };
}

export async function getRecommendations(
  id: string | number,
  limit = 24
): Promise<Track[]> {
  const data = await apiFetch<{
    data: { items?: { track?: Track }[] };
  }>(`/recommendations/?id=${id}&limit=${limit}`);
  return (data.data?.items ?? [])
    .map((i) => i.track)
    .filter((t): t is Track => !!t);
}

export async function searchPlaylists(
  query: string,
  limit = 12
): Promise<Playlist[]> {
  const data = await apiFetch<{ data: { playlists?: { items?: Playlist[] } } }>(
    `/search/?p=${encodeURIComponent(query)}&limit=${limit}`
  );
  return data.data?.playlists?.items ?? [];
}

export async function getPlaylist(
  id: string,
  limit = 300
): Promise<{ playlist: Playlist; items: Track[] }> {
  const data = await apiFetch<{
    playlist?: Playlist;
    items?: (Track | { item?: Track })[];
  }>(`/playlist/?id=${encodeURIComponent(id)}&limit=${limit}`);
  const items = (data.items ?? [])
    .map((t) => {
      if (t && "item" in t && t.item) return t.item;
      return t as Track;
    })
    .filter((t): t is Track => !!t && typeof t.id === "number");
  return {
    playlist:
      data.playlist ?? {
        uuid: id,
        title: "Playlist",
        numberOfTracks: items.length,
      },
    items,
  };
}

export async function getMix(
  id: string,
  limit = 300
): Promise<{ mix: TrackMix | null; items: Track[] }> {
  const data = await apiFetch<{
    mix?: TrackMix | null;
    items?: (Track | { item?: Track })[];
  }>(`/mix/?id=${encodeURIComponent(id)}&limit=${limit}`);
  const items = (data.items ?? [])
    .map((t) => {
      if (t && "item" in t && t.item) return t.item;
      return t as Track;
    })
    .filter((t): t is Track => !!t && typeof t.id === "number");
  return { mix: data.mix ?? null, items };
}

export async function getLyrics(
  id: string | number
): Promise<{ text?: string; subtitle?: string } | null> {
  const data = await apiFetch<{ lyrics?: { text?: string; subtitle?: string } | null }>(
    `/lyrics/?id=${id}`
  );
  return data.lyrics ?? null;
}
