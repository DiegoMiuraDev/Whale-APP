import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchByLyricsOnSpotify } from "@/lib/lyrics-search";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  const q = req.nextUrl.searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json(
      { error: "Informe pelo menos 2 caracteres" },
      { status: 400 },
    );
  }

  const tracks = await searchByLyricsOnSpotify(
    q.trim(),
    session?.user?.id,
    10,
  );

  const results = tracks.map((spotify) => ({
    lyric: {
      track_name: spotify.name,
      artist_name: spotify.artists.map((a) => a.name).join(", "),
      snippet: q.trim().slice(0, 80),
    },
    spotify,
  }));

  if (session?.user?.id && tracks[0]) {
    await prisma.identificationLog.create({
      data: {
        userId: session.user.id,
        source: "lyrics",
        trackName: tracks[0].name,
        artist: tracks[0].artists.map((a) => a.name).join(", "),
        rawJson: JSON.stringify(tracks),
      },
    });
  }

  return NextResponse.json({ results });
}
