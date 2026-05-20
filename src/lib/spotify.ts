import { prisma } from "@/lib/prisma";
import { getSpotifyCredentials } from "@/lib/spotify-auth";

const SPOTIFY_API = "https://api.spotify.com/v1";
const SPOTIFY_SEARCH_MAX_LIMIT = 10;

function clampSearchLimit(limit: number): number {
  return Math.min(Math.max(1, limit), SPOTIFY_SEARCH_MAX_LIMIT);
}

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  uri: string;
  external_urls: { spotify: string };
  preview_url: string | null;
  duration_ms: number;
};

export type SpotifyApiError = {
  status: number;
  body: string;
  path: string;
};

async function getSpotifyAccessToken(userId: string): Promise<string | null> {
  const creds = await getSpotifyCredentials(userId);
  if (!creds) return null;

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = creds.expiresAt;

  if (!expiresAt || expiresAt > now + 60) {
    return creds.accessToken;
  }

  if (!creds.refreshToken) {
    console.warn("[spotify] token expirado sem refresh_token");
    return creds.accessToken;
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: creds.refreshToken,
    }),
  });

  if (!res.ok) {
    console.error("[spotify] refresh token failed", res.status, await res.text());
    return creds.accessToken;
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  if (creds.accountId) {
    await prisma.account.update({
      where: { id: creds.accountId },
      data: {
        access_token: data.access_token,
        expires_at: now + data.expires_in,
        ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
      },
    });
  }

  return data.access_token;
}

async function spotifyFetch<T>(
  userId: string,
  path: string,
  options?: RequestInit,
): Promise<{ data: T | null; error?: SpotifyApiError }> {
  const token = await getSpotifyAccessToken(userId);
  if (!token) {
    return {
      data: null,
      error: { status: 401, body: "Sem token Spotify", path },
    };
  }

  const res = await fetch(`${SPOTIFY_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[spotify] ${path} → ${res.status}`, body.slice(0, 300));
    return {
      data: null,
      error: { status: res.status, body, path },
    };
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { data: {} as T };
  }

  const text = await res.text();
  if (!text) return { data: {} as T };

  return { data: JSON.parse(text) as T };
}

function parseSearchItems(
  data: { tracks?: { items: (SpotifyTrack | null)[] } } | null,
): SpotifyTrack[] {
  return (data?.tracks?.items ?? []).filter(
    (t): t is SpotifyTrack => t != null && Boolean(t.id && t.name),
  );
}

export type SearchTracksResult = {
  tracks: SpotifyTrack[];
  error?: string;
  source: "user" | "public";
};

export async function searchTracks(
  userId: string,
  query: string,
  limit = 10,
  market = "BR",
): Promise<SearchTracksResult> {
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: String(clampSearchLimit(limit)),
    market,
  });

  const { data, error } = await spotifyFetch<{
    tracks: { items: (SpotifyTrack | null)[] };
  }>(userId, `/search?${params}`);

  const tracks = parseSearchItems(data);

  if (tracks.length > 0) {
    return { tracks, source: "user" };
  }

  if (error) {
    return {
      tracks: [],
      error:
        error.status === 401
          ? "Sessão Spotify expirada. Saia e entre de novo."
          : `Spotify retornou erro ${error.status}`,
      source: "user",
    };
  }

  return { tracks: [], source: "user" };
}

export async function searchTracksWithFallback(
  userId: string,
  query: string,
  limit = 10,
): Promise<SearchTracksResult> {
  const userResult = await searchTracks(userId, query, limit);
  if (userResult.tracks.length > 0) return userResult;

  const publicTracks = await searchTracksPublic(query, limit);
  if (publicTracks.length > 0) {
    return { tracks: publicTracks, source: "public" };
  }

  return {
    tracks: [],
    error:
      userResult.error ??
      "Nenhuma faixa encontrada. Tente outro termo ou reconecte o Spotify.",
    source: "user",
  };
}

export async function searchTracksPublic(
  query: string,
  limit = 10,
): Promise<SpotifyTrack[]> {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return [];
  }

  const safeLimit = clampSearchLimit(limit);

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
      ).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!tokenRes.ok) return [];
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const res = await fetch(
    `${SPOTIFY_API}/search?${new URLSearchParams({
      q: query,
      type: "track",
      limit: String(safeLimit),
      market: "BR",
    })}`,
    { headers: { Authorization: `Bearer ${access_token}` } },
  );

  if (!res.ok) {
    console.error("[spotify] public search", res.status, await res.text());
    return [];
  }
  const data = (await res.json()) as {
    tracks: { items: (SpotifyTrack | null)[] };
  };
  return parseSearchItems(data);
}

export async function createPlaylist(
  userId: string,
  name: string,
  description: string,
  trackUris: string[],
): Promise<
  | { id: string; external_urls: { spotify: string }; tracksAdded: number }
  | { error: string }
> {
  if (trackUris.length === 0) {
    return { error: "Nenhuma faixa encontrada para adicionar à playlist." };
  }

  const { data: playlist, error: createError } = await spotifyFetch<{
    id: string;
    external_urls: { spotify: string };
  }>(userId, "/me/playlists", {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
      public: false,
    }),
  });

  if (!playlist?.id) {
    const detail = createError
      ? `Spotify ${createError.status}: ${createError.body.slice(0, 120)}`
      : "Falha ao criar playlist";
    return { error: detail };
  }

  const { error: addError } = await spotifyFetch(
    userId,
    `/playlists/${playlist.id}/tracks`,
    {
      method: "POST",
      body: JSON.stringify({ uris: trackUris.slice(0, 100) }),
    },
  );

  if (addError) {
    return {
      error: `Playlist criada, mas faixas não foram adicionadas (${addError.status}).`,
    };
  }

  return {
    id: playlist.id,
    external_urls: playlist.external_urls,
    tracksAdded: trackUris.length,
  };
}

export async function deletePlaylist(
  userId: string,
  playlistId: string,
): Promise<boolean> {
  const token = await getSpotifyAccessToken(userId);
  if (!token) return false;

  const res = await fetch(
    `${SPOTIFY_API}/playlists/${playlistId}/followers`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.ok || res.status === 404;
}

export async function getUserPlaylists(userId: string) {
  const { data } = await spotifyFetch<{
    items: {
      id: string;
      name: string;
      description: string | null;
      external_urls: { spotify: string };
      images: { url: string }[];
      tracks: { total: number };
    }[];
  }>(userId, "/me/playlists?limit=50");
  return data;
}
