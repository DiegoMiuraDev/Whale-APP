import { prisma } from "@/lib/prisma";

const SPOTIFY_API = "https://api.spotify.com/v1";

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

async function getSpotifyAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "spotify" },
  });
  if (!account?.access_token) return null;

  const expiresAt = account.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);

  if (expiresAt > now + 60) {
    return account.access_token;
  }

  if (!account.refresh_token) return account.access_token;

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
      refresh_token: account.refresh_token,
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: now + data.expires_in,
      ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
    },
  });

  return data.access_token;
}

async function spotifyFetch<T>(
  userId: string,
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  const token = await getSpotifyAccessToken(userId);
  if (!token) return null;

  const res = await fetch(`${SPOTIFY_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function searchTracks(
  userId: string,
  query: string,
  limit = 10,
): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch<{ tracks: { items: SpotifyTrack[] } }>(
    userId,
    `/search?${new URLSearchParams({
      q: query,
      type: "track",
      limit: String(limit),
    })}`,
  );
  return data?.tracks?.items ?? [];
}

export async function searchTracksPublic(
  query: string,
  limit = 10,
): Promise<SpotifyTrack[]> {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return [];
  }

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
      limit: String(limit),
    })}`,
    { headers: { Authorization: `Bearer ${access_token}` } },
  );

  if (!res.ok) return [];
  const data = (await res.json()) as { tracks: { items: SpotifyTrack[] } };
  return data.tracks?.items ?? [];
}

export async function createPlaylist(
  userId: string,
  name: string,
  description: string,
  trackUris: string[],
): Promise<{ id: string; external_urls: { spotify: string } } | null> {
  const me = await spotifyFetch<{ id: string }>(userId, "/me");
  if (!me) return null;

  const playlist = await spotifyFetch<{
    id: string;
    external_urls: { spotify: string };
  }>(userId, `/users/${me.id}/playlists`, {
    method: "POST",
    body: JSON.stringify({ name, description, public: true }),
  });

  if (!playlist || trackUris.length === 0) return playlist;

  await spotifyFetch(userId, `/playlists/${playlist.id}/tracks`, {
    method: "POST",
    body: JSON.stringify({ uris: trackUris.slice(0, 100) }),
  });

  return playlist;
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
  return spotifyFetch<{
    items: {
      id: string;
      name: string;
      description: string | null;
      external_urls: { spotify: string };
      images: { url: string }[];
      tracks: { total: number };
    }[];
  }>(userId, "/me/playlists?limit=50");
}
