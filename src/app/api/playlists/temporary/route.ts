import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPlaylist } from "@/lib/spotify";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  trackUris: z.array(z.string()).min(1).max(50),
  hours: z.number().min(1).max(168),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const playlists = await prisma.tempPlaylist.findMany({
    where: { userId: session.user.id, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "asc" },
  });

  return NextResponse.json({ playlists });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, trackUris, hours } = parsed.data;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  const playlist = await createPlaylist(
    session.user.id,
    name,
    `Whale temporária — expira em ${hours}h`,
    trackUris,
  );

  if (!playlist) {
    return NextResponse.json(
      { error: "Falha ao criar playlist no Spotify" },
      { status: 500 },
    );
  }

  const temp = await prisma.tempPlaylist.create({
    data: {
      userId: session.user.id,
      spotifyPlaylistId: playlist.id,
      name,
      expiresAt,
    },
  });

  return NextResponse.json({
    playlist: temp,
    spotifyUrl: playlist.external_urls.spotify,
  });
}
