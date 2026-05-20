import { identifyAudio, type IdentifiedTrack } from "@/lib/audd";
import { searchByLyricsOnSpotify } from "@/lib/lyrics-search";
import {
  createPlaylist,
  searchTracks,
  searchTracksPublic,
  type SpotifyTrack,
} from "@/lib/spotify";
import { prisma } from "@/lib/prisma";
import { asStringArray, pickArg, pickNumber } from "@/lib/tool-args";

export type ToolResult =
  | { tool: "identify_audio"; data: IdentifiedTrack | null }
  | { tool: "search_lyrics"; data: SpotifyTrack[] }
  | { tool: "search_catalog"; data: SpotifyTrack[] }
  | {
      tool: "create_playlist";
      data: { id: string; url: string; expiresAt?: string; tracksAdded: number } | null;
      error?: string;
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
  const seen = new Set<string>();

  for (const q of trackQueries.slice(0, 20)) {
    const tracks = await searchTracks(userId, q, 3);
    for (const track of tracks) {
      if (!seen.has(track.uri)) {
        seen.add(track.uri);
        uris.push(track.uri);
      }
      if (uris.length >= 20) break;
    }
    if (uris.length >= 20) break;
  }

  if (uris.length === 0) {
    return {
      tool: "create_playlist",
      data: null,
      error: `Não encontrei faixas no Spotify para: ${trackQueries.slice(0, 3).join(", ")}`,
    };
  }

  const hours = temporaryHours && temporaryHours > 0 ? temporaryHours : 24;
  const description = `Playlist temporária Whale — expira em ${hours}h`;

  const result = await createPlaylist(userId, name, description, uris);

  if ("error" in result) {
    return { tool: "create_playlist", data: null, error: result.error };
  }

  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  await prisma.tempPlaylist.create({
    data: {
      userId,
      spotifyPlaylistId: result.id,
      name,
      expiresAt,
      createdByAgent: true,
    },
  });

  return {
    tool: "create_playlist",
    data: {
      id: result.id,
      url: result.external_urls.spotify,
      expiresAt: expiresAt.toISOString(),
      tracksAdded: result.tracksAdded,
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
      return runSearchCatalog(
        String(pickArg(args, "query", "q") ?? ""),
        userId,
      );
    case "search_lyrics":
      return runSearchLyrics(
        String(pickArg(args, "text", "lyrics", "query") ?? ""),
        userId,
      );
    case "create_playlist": {
      if (!userId) throw new Error("Login necessário para criar playlist");
      const trackQueries = asStringArray(
        pickArg(args, "track_queries", "trackQueries", "tracks", "songs"),
      );
      return runCreatePlaylist(
        userId,
        String(pickArg(args, "name", "playlist_name", "title") ?? "Whale"),
        trackQueries,
        pickNumber(args, "temporary_hours", "temporaryHours", "hours"),
      );
    }
    default:
      throw new Error(`Tool desconhecida: ${name}`);
  }
}

export function formatCreatePlaylistFeedback(
  toolResults: unknown[],
): string | null {
  for (const raw of toolResults) {
    if (!raw || typeof raw !== "object") continue;
    const tr = raw as ToolResult;
    if (tr.tool !== "create_playlist") continue;

    if (tr.data?.url) {
      return `\n\n✅ Playlist criada no Spotify (${tr.data.tracksAdded} faixa(s)): ${tr.data.url}\nTambém aparece em **Playlists** no Whale.`;
    }
    if (tr.error) {
      return `\n\n⚠️ Não foi possível criar a playlist: ${tr.error}`;
    }
  }
  return null;
}
