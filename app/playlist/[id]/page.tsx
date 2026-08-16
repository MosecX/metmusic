import { notFound } from "next/navigation";
import { getPlaylistPage, playlistCoverUrl, checkApiHealth } from "@/lib/tidal";
import { PlaylistContent } from "@/components/playlist-content";
import ApiStatusBanner from "@/components/api-status";

export const metadata = { title: "Playlist — MetMusic" };

export default async function PlaylistPage({
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
    data = await getPlaylistPage(id, 50, 0);
  } catch {
    notFound();
  }

  const { playlist, items } = data;

  return (
    <div className="fade-up">
      <PlaylistContent
        id={id}
        title={playlist.title}
        description={playlist.description}
        cover={playlistCoverUrl(playlist, 1080)}
        duration={playlist.duration}
        total={playlist.numberOfTracks ?? items.length}
        initialItems={items}
      />
    </div>
  );
}