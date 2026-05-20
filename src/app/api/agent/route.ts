import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runIdentifyAudio } from "@/lib/agent-tools";
import { runGeminiAgent } from "@/lib/gemini-agent";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const body = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      audioBase64?: string;
    };

    const toolResults: unknown[] = [];
    let extraContext: string | undefined;

    if (body.audioBase64) {
      const identifyResult = await runIdentifyAudio(body.audioBase64, userId);
      toolResults.push(identifyResult);
      extraContext = `Áudio identificado: ${JSON.stringify(identifyResult.data)}`;
    }

    const { message, toolResults: agentTools } = await runGeminiAgent(
      body.messages,
      userId,
      extraContext,
    );

    return NextResponse.json({
      message,
      toolResults: [...toolResults, ...agentTools],
    });
  } catch (err) {
    console.error("[api/agent]", err);
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json(
      { message: `Erro ao contactar o agente: ${msg}`, toolResults: [] },
      { status: 500 },
    );
  }
}
