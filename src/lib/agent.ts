import type { ChatMessage } from "@/lib/gemini-agent";
import { runGeminiAgent } from "@/lib/gemini-agent";
import { runOpenRouterAgent } from "@/lib/openrouter-agent";
import { executeAgentTool } from "@/lib/agent-tools";

function prefersOpenRouter(): boolean {
  const provider = process.env.LLM_PROVIDER?.toLowerCase();
  if (provider === "openrouter") return Boolean(process.env.OPENROUTER_API_KEY);
  if (provider === "gemini") return false;
  return Boolean(process.env.OPENROUTER_API_KEY);
}

async function runLocalFallback(
  lastMessage: string,
  userId?: string,
): Promise<{ message: string; toolResults: unknown[] }> {
  const text = lastMessage.toLowerCase();
  const toolResults: unknown[] = [];

  if (text.includes("letra") || text.length > 10) {
    const result = await executeAgentTool(
      "search_lyrics",
      { text: lastMessage },
      userId,
    );
    toolResults.push(result);
    if (result.tool === "search_lyrics" && result.data.length > 0) {
      const tracks = result.data
        .slice(0, 3)
        .map((t) => `• ${t.name} — ${t.artists.map((a) => a.name).join(", ")}`)
        .join("\n");
      return {
        message: `IA indisponível — busca direta no Spotify:\n\n${tracks}`,
        toolResults,
      };
    }
  }

  if (
    text.includes("busca") ||
    text.includes("música") ||
    text.includes("musica") ||
    text.includes("artista") ||
    text.includes("playlist")
  ) {
    const query =
      lastMessage.replace(/busca|música|musica|artista|playlist/gi, "").trim() ||
      lastMessage;
    const result = await executeAgentTool(
      "search_catalog",
      { query },
      userId,
    );
    toolResults.push(result);
    if (result.tool === "search_catalog" && result.data.length > 0) {
      const tracks = result.data
        .slice(0, 5)
        .map((t) => `• ${t.name} — ${t.artists.map((a) => a.name).join(", ")}`)
        .join("\n");
      return {
        message: `IA indisponível — resultados do Spotify:\n\n${tracks}`,
        toolResults,
      };
    }
  }

  return {
    message:
      "O agente IA está indisponível no momento. Você ainda pode:\n" +
      "• **Descobrir** — buscar músicas\n" +
      "• **Playlists** — marcar faixas e criar playlist\n" +
      "• **Microfone** — identificar música\n\n" +
      "Configure `OPENROUTER_API_KEY` em https://openrouter.ai/keys",
    toolResults,
  };
}

export async function runAgent(
  messages: ChatMessage[],
  userId?: string,
  extraContext?: string,
): Promise<{ message: string; toolResults: unknown[] }> {
  const lastUser = messages.at(-1)?.content ?? "";

  if (prefersOpenRouter()) {
    try {
      return await runOpenRouterAgent(messages, userId, extraContext);
    } catch (err) {
      console.error("[agent] OpenRouter falhou:", err);
      if (process.env.GEMINI_API_KEY) {
        return runGeminiAgent(messages, userId, extraContext);
      }
      return runLocalFallback(lastUser, userId);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    return runGeminiAgent(messages, userId, extraContext);
  }

  if (process.env.OPENROUTER_API_KEY) {
    return runOpenRouterAgent(messages, userId, extraContext);
  }

  return runLocalFallback(lastUser, userId);
}

export type { ChatMessage };
