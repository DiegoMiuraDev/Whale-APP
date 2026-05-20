import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export type SpotifyCredentials = {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: number | null;
  accountId?: string;
};

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

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const jwt = await getToken({
    req: { headers: { cookie: cookieHeader } },
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (jwt?.sub !== userId || !jwt.spotifyAccessToken) return null;

  return {
    accessToken: jwt.spotifyAccessToken as string,
    refreshToken: jwt.spotifyRefreshToken as string | undefined,
    expiresAt: jwt.spotifyExpiresAt as number | undefined,
  };
}
