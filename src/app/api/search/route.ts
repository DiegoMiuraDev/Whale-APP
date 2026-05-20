import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchTracksPublic, searchTracksWithFallback } from "@/lib/spotify";

export async function GET(req: NextRequest) {
  const session = await auth();
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ tracks: [] });
  }

  if (!session?.user?.id) {
    const tracks = await searchTracksPublic(q, 20);
    if (tracks.length === 0) {
      return NextResponse.json({
        tracks: [],
        error: "Entre com Spotify para buscar no catálogo completo.",
      });
    }
    return NextResponse.json({ tracks, source: "public" });
  }

  const result = await searchTracksWithFallback(session.user.id, q, 20);

  return NextResponse.json({
    tracks: result.tracks,
    error: result.error,
    source: result.source,
  });
}
