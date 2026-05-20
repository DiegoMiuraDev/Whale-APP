import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import { useSecureAuthCookies } from "@/lib/auth-cookies";
import { prisma } from "@/lib/prisma";

export type SpotifyCredentials = {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: number | null;
  accountId?: string;
};

async function readJwtForUser(userId: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const secure = useSecureAuthCookies();

  let jwt = await getToken({
    req: { headers: { cookie: cookieHeader } },
    secret: process.env.AUTH_SECRET,
    secureCookie: secure,
  });

  if (!jwt?.spotifyAccessToken && secure) {
    jwt = await getToken({
      req: { headers: { cookie: cookieHeader } },
      secret: process.env.AUTH_SECRET,
      secureCookie: false,
    });
  }

  if (!jwt?.spotifyAccessToken && !secure) {
    jwt = await getToken({
      req: { headers: { cookie: cookieHeader } },
      secret: process.env.AUTH_SECRET,
      secureCookie: true,
    });
  }

  if (jwt?.sub !== userId || !jwt.spotifyAccessToken) return null;

  return jwt;
}

export async function getSpotifyCredentials(
  userId: string,
): Promise<SpotifyCredentials | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "spotify" },
  });

  if (account?.access_token) {
    return {
      accessToken: account.access_token,
      refreshToken: account.refresh_token,
      expiresAt: account.expires_at,
      accountId: account.id,
    };
  }

  const jwt = await readJwtForUser(userId);
  if (!jwt) return null;

  const creds: SpotifyCredentials = {
    accessToken: jwt.spotifyAccessToken as string,
    refreshToken: jwt.spotifyRefreshToken as string | undefined,
    expiresAt: jwt.spotifyExpiresAt as number | undefined,
  };

  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: creds.accessToken,
        refresh_token: creds.refreshToken,
        expires_at: creds.expiresAt,
      },
    });
    creds.accountId = account.id;
  }

  return creds;
}
