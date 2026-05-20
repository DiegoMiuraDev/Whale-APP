import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deletePlaylist } from "@/lib/spotify";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const expired = await prisma.tempPlaylist.findMany({
    where: { expiresAt: { lte: new Date() } },
  });

  let deleted = 0;
  for (const pl of expired) {
    const ok = await deletePlaylist(pl.userId, pl.spotifyPlaylistId);
    if (ok) deleted++;
    await prisma.tempPlaylist.delete({ where: { id: pl.id } });
  }

  return NextResponse.json({
    processed: expired.length,
    deletedFromSpotify: deleted,
  });
}
