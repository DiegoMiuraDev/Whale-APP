import { searchTracks, searchTracksPublic, type SpotifyTrack } from "@/lib/spotify";

export async function searchByLyricsOnSpotify(
  lyrics: string,
  userId?: string,
  limit = 10,
): Promise<SpotifyTrack[]> {
  const query = lyrics.trim().slice(0, 100);
  if (query.length < 2) return [];

  return userId
    ? await searchTracks(userId, query, limit)
    : await searchTracksPublic(query, limit);
}
