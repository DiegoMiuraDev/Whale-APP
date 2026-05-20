import { identifyAudio, type IdentifiedTrack } from "@/lib/audd";
import { searchByLyricsOnSpotify } from "@/lib/lyrics-search";
import {
  createPlaylist,
  searchTracks,
  searchTracksPublic,
  type SpotifyTrack,
} from "@/lib/spotify";
import { prisma } from "@/lib/prisma";

export type ToolResult =
  | { tool: "identify_audio"; data: IdentifiedTrack | null }
  | { tool: "search_lyrics"; data: SpotifyTrack[] }
  | { tool: "search_catalog"; data: SpotifyTrack[] }
  | {
      tool: "create_playlist";
      data: { id: string; url: string; expiresAt?: string } | null;
    };

export async function runIdentifyAudio(
  audioBase64: string,
  userId?: string,
): Promise<ToolResult> {
  const buffer = Buffer.from(audioBase64, "base64");
  const result = await identifyAudio(buffer);

  if (result && userId) {
    await prisma.identificationLog.create({
      data: {
        userId,
        source: "mic",
        trackName: result.title,
        artist: result.artist,
        rawJson: JSON.stringify(result),
      },
    });
  }

  return { tool: "identify_audio", data: result };
}

export async function runSearchLyrics(
  text: string,
  userId?: string,
): Promise<ToolResult> {
  const results = await searchByLyricsOnSpotify(text, userId);

  if (userId && results[0]) {
    await prisma.identificationLog.create({
      data: {
        userId,
        source: "lyrics",
        trackName: results[0].name,
        artist: results[0].artists.map((a) => a.name).join(", "),
        rawJson: JSON.stringify(results),
      },
    });
  }

  return { tool: "search_lyrics", data: results };
}

export async function runSearchCatalog(
  query: string,
  userId?: string,
): Promise<ToolResult> {
  const tracks = userId
    ? await searchTracks(userId, query)
    : await searchTracksPublic(query);
  return { tool: "search_catalog", data: tracks };
}

export async function runCreatePlaylist(
  userId: string,
  name: string,
  trackQueries: string[],
  temporaryHours?: number,
): Promise<ToolResult> {
  const uris: string[] = [];

  for (const q of trackQueries.slice(0, 20)) {
    const tracks = await searchTracks(userId, q, 1);
    if (tracks[0]) uris.push(tracks[0].uri);
  }

  const description = temporaryHours
    ? `Playlist temporária Whale — expira em ${temporaryHours}h`
    : "Criada pelo agente Whale";

  const playlist = await createPlaylist(userId, name, description, uris);
  if (!playlist) return { tool: "create_playlist", data: null };

  let expiresAt: Date | undefined;
  if (temporaryHours) {
    expiresAt = new Date(Date.now() + temporaryHours * 60 * 60 * 1000);
    await prisma.tempPlaylist.create({
      data: {
        userId,
        spotifyPlaylistId: playlist.id,
        name,
        expiresAt,
        createdByAgent: true,
      },
    });
  }

  return {
    tool: "create_playlist",
    data: {
      id: playlist.id,
      url: playlist.external_urls.spotify,
      expiresAt: expiresAt?.toISOString(),
    },
  };
}

export async function executeAgentTool(
  name: string,
  args: Record<string, unknown>,
  userId?: string,
): Promise<ToolResult> {
  switch (name) {
    case "search_catalog":
      return runSearchCatalog(String(args.query), userId);
    case "search_lyrics":
      return runSearchLyrics(String(args.text), userId);
    case "create_playlist":
      if (!userId) throw new Error("Login necessário para criar playlist");
      return runCreatePlaylist(
        userId,
        String(args.name),
        (args.track_queries as string[]) ?? [],
        args.temporary_hours as number | undefined,
      );
    default:
      throw new Error(`Tool desconhecida: ${name}`);
  }
}
