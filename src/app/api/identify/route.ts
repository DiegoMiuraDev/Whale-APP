import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { identifyAudio } from "@/lib/audd";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  const formData = await req.formData();
  const file = formData.get("audio");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Arquivo de áudio obrigatório" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await identifyAudio(buffer, "recording.webm");

  if (!result) {
    return NextResponse.json(
      { error: "Não foi possível identificar a música" },
      { status: 404 },
    );
  }

  if (session?.user?.id) {
    await prisma.identificationLog.create({
      data: {
        userId: session.user.id,
        source: "mic",
        trackName: result.title,
        artist: result.artist,
        rawJson: JSON.stringify(result),
      },
    });
  }

  return NextResponse.json({ result });
}
