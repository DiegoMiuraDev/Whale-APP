import type { NextAuthConfig } from "next-auth";
import Spotify from "next-auth/providers/spotify";

const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-playback-state",
  "user-read-currently-playing",
].join(" ");

export const APP_URL = (
  process.env.NGROK_URL ??
  process.env.APP_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

export const AUTH_BASE_URL = process.env.AUTH_URL?.replace(/\/$/, "") ??
  `${APP_URL}/api/auth`;

export const SPOTIFY_REDIRECT_URI = `${AUTH_BASE_URL}/callback/spotify`;

export const IS_NGROK = APP_URL.startsWith("https://") && APP_URL.includes("ngrok");

export const authConfig: NextAuthConfig = {
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent(SPOTIFY_SCOPES)}`,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isAppRoute =
        request.nextUrl.pathname.startsWith("/discover") ||
        request.nextUrl.pathname.startsWith("/agent") ||
        request.nextUrl.pathname.startsWith("/playlists");
      if (isAppRoute) return !!auth?.user;
      return true;
    },
    jwt({ token, user, account }) {
      if (user?.id) token.sub = user.id;
      if (account?.provider === "spotify") {
        token.spotifyAccessToken = account.access_token;
        token.spotifyRefreshToken = account.refresh_token;
        token.spotifyExpiresAt = account.expires_at;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
};
