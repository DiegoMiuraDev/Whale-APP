import {
  GoogleGenerativeAI,
  type Content,
  type GenerativeModel,
  type Part,
} from "@google/generative-ai";
import { AGENT_SYSTEM_PROMPT } from "@/lib/agent-prompt";
import { GEMINI_FUNCTION_DECLARATIONS } from "@/lib/gemini-tools";
import { executeAgentTool } from "@/lib/agent-tools";

const FALLBACK_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
] as const;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function buildGeminiHistory(messages: ChatMessage[]): Content[] {
  const prior = messages.slice(0, -1);
  const history: Content[] = [];
  let started = false;

  for (const m of prior) {
    const role = m.role === "user" ? "user" : "model";
    if (!started) {
      if (role === "model") continue;
      started = true;
    }
    const last = history[history.length - 1];
    if (last?.role === role) {
      last.parts[0].text += `\n\n${m.content}`;
      continue;
    }
    history.push({ role, parts: [{ text: m.content }] });
  }

  return history;
}

function getModelCandidates(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const list = preferred
    ? [preferred, ...FALLBACK_MODELS.filter((m) => m !== preferred)]
    : [...FALLBACK_MODELS];
  return [...new Set(list)];
}

function isQuotaError(msg: string): boolean {
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("Quota exceeded") ||
    msg.includes("rate-limit")
  );
}

async function runChatWithModel(
  model: GenerativeModel,
  history: Content[],
  userParts: Part[],
  userId?: string,
): Promise<{ message: string; toolResults: unknown[] }> {
  const chat = model.startChat({ history });
  const toolResults: unknown[] = [];

  let result = await chat.sendMessage(userParts);

  for (let i = 0; i < 5; i++) {
    const functionCalls = result.response.functionCalls();
    if (!functionCalls?.length) break;

    const functionResponses = await Promise.all(
      functionCalls.map(async (call) => {
        const args = call.args as Record<string, unknown>;
        const toolResult = await executeAgentTool(call.name, args, userId);
        toolResults.push(toolResult);
        return {
          functionResponse: {
            name: call.name,
            response: toolResult,
          },
        };
      }),
    );

    result = await chat.sendMessage(functionResponses);
  }

  return {
    message: result.response.text() || "Pronto!",
    toolResults,
  };
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
        message: `Cota Gemini esgotada — busca direta no Spotify:\n\n${tracks}\n\nAtive billing em https://aistudio.google.com ou aguarde a cota renovar.`,
        toolResults,
      };
    }
  }

  if (
    text.includes("busca") ||
    text.includes("música") ||
    text.includes("musica") ||
    text.includes("artista")
  ) {
    const query = lastMessage.replace(/busca|música|musica|artista/gi, "").trim() || lastMessage;
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
        message: `Cota Gemini esgotada — resultados do Spotify:\n\n${tracks}`,
        toolResults,
      };
    }
  }

  return {
    message:
      "A cota gratuita do Gemini esgotou para hoje. Você ainda pode:\n" +
      "• **Descobrir** — buscar músicas manualmente\n" +
      "• **Microfone** — identificar faixas (AudD)\n" +
      "• **Busca por letra** — painel ao lado\n\n" +
      "Para o chat com IA: aguarde ~24h, ative billing em https://aistudio.google.com/apikey ou troque `GEMINI_MODEL=gemini-1.5-flash` no `.env`.",
    toolResults,
  };
}

export async function runGeminiAgent(
  messages: ChatMessage[],
  userId?: string,
  extraContext?: string,
): Promise<{ message: string; toolResults: unknown[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      message: getOfflineResponse(messages.at(-1)?.content ?? ""),
      toolResults: [],
    };
  }

  const history = buildGeminiHistory(messages);
  const lastUser = messages.at(-1);
  const userParts: Part[] = [];

  if (extraContext) {
    userParts.push({ text: extraContext });
  }
  if (lastUser?.content) {
    userParts.push({ text: lastUser.content });
  }

  if (userParts.length === 0) {
    return { message: "Envie uma mensagem ou áudio.", toolResults: [] };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = getModelCandidates();
  let lastError = "";

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: AGENT_SYSTEM_PROMPT,
        tools: [{ functionDeclarations: GEMINI_FUNCTION_DECLARATIONS }],
      });

      const result = await runChatWithModel(
        model,
        history,
        userParts,
        userId,
      );

      if (modelName !== models[0]) {
        console.info(`[gemini-agent] OK com modelo fallback: ${modelName}`);
      }

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = msg;
      console.warn(`[gemini-agent] ${modelName} falhou:`, msg.slice(0, 120));

      if (!isQuotaError(msg) && !msg.includes("404") && !msg.includes("not found")) {
        break;
      }
    }
  }

  if (isQuotaError(lastError)) {
    return runLocalFallback(lastUser?.content ?? "", userId);
  }

  if (lastError.includes("API key") || lastError.includes("API_KEY")) {
    return {
      message:
        "Chave Gemini inválida. Gere uma em https://aistudio.google.com/apikey",
      toolResults: [],
    };
  }

  return {
    message: `Não consegui processar: ${lastError.slice(0, 200)}`,
    toolResults: [],
  };
}

function getOfflineResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("playlist")) {
    return "Configure OPENROUTER_API_KEY (openrouter.ai) ou GEMINI_API_KEY. Use Descobrir e Playlists enquanto isso.";
  }
  if (lower.includes("letra")) {
    return "Use a busca por letra ao lado — pesquisa no catálogo Spotify.";
  }
  return "Configure OPENROUTER_API_KEY em https://openrouter.ai/keys";
}
