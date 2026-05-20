import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchTracks, searchTracksPublic } from "@/lib/spotify";

export async function GET(req: NextRequest) {
  const session = await auth();
  const q = req.nextUrl.searchParams.get("q");

  if (!q || q.trim().length < 1) {
    return NextResponse.json({ tracks: [] });
  }

  const tracks = session?.user?.id
    ? await searchTracks(session.user.id, q.trim(), 20)
    : await searchTracksPublic(q.trim(), 20);

  return NextResponse.json({ tracks });
}
