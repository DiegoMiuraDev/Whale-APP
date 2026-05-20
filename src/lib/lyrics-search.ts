import {
  searchTracksPublic,
  searchTracksWithFallback,
  type SpotifyTrack,
} from "@/lib/spotify";

export async function searchByLyricsOnSpotify(
  lyrics: string,
  userId?: string,
  limit = 10,
): Promise<SpotifyTrack[]> {
  const query = lyrics.trim().slice(0, 100);
  if (query.length < 2) return [];

  return userId
    ? (await searchTracksWithFallback(userId, query, limit)).tracks
    : await searchTracksPublic(query, limit);
}
