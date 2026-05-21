import { APP_URL } from "@/lib/auth.config";
import { AGENT_SYSTEM_PROMPT } from "@/lib/agent-prompt";
import { OPENAI_AGENT_TOOLS } from "@/lib/agent-tool-definitions";
import { executeAgentTool } from "@/lib/agent-tools";
import type { ChatMessage } from "@/lib/gemini-agent";

const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
];

function isRetryableModelError(msg: string): boolean {
  return (
    msg.includes("404") ||
    msg.includes("No endpoints found") ||
    msg.includes("429") ||
    msg.includes("rate") ||
    msg.includes("quota")
  );
}

type OpenAIMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type ChatCompletionResponse = {
  choices?: {
    message?: {
      content?: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason?: string;
  }[];
  error?: { message?: string };
};

function getModelCandidates(): string[] {
  const preferred = process.env.OPENROUTER_MODEL?.trim();
  const list = preferred
    ? [preferred, ...DEFAULT_MODELS.filter((m) => m !== preferred)]
    : [...DEFAULT_MODELS];
  return [...new Set(list)];
}

function buildOpenAIMessages(
  messages: ChatMessage[],
  extraContext?: string,
): OpenAIMessage[] {
  const out: OpenAIMessage[] = [
    { role: "system", content: AGENT_SYSTEM_PROMPT },
  ];

  for (const m of messages) {
    out.push({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    });
  }

  if (extraContext) {
    out.push({ role: "user", content: extraContext });
  }

  return out;
}

function parseToolArgs(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function callOpenRouter(
  model: string,
  messages: OpenAIMessage[],
): Promise<ChatCompletionResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY não configurada");

  const res = await fetch(OPENROUTER_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": APP_URL,
      "X-Title": "Whale Music Companion",
    },
    body: JSON.stringify({
      model,
      messages,
      tools: OPENAI_AGENT_TOOLS,
      tool_choice: "auto",
      temperature: 0.7,
    }),
  });

  const data = (await res.json()) as ChatCompletionResponse;

  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText;
    throw new Error(`${res.status}: ${msg}`);
  }

  return data;
}

export async function runOpenRouterAgent(
  messages: ChatMessage[],
  userId?: string,
  extraContext?: string,
): Promise<{ message: string; toolResults: unknown[] }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY ausente");
  }

  const chatMessages = buildOpenAIMessages(messages, extraContext);
  const toolResults: unknown[] = [];
  const models = getModelCandidates();
  const errors: string[] = [];

  for (const model of models) {
    try {
      let currentMessages = [...chatMessages];

      for (let round = 0; round < 6; round++) {
        const data = await callOpenRouter(model, currentMessages);
        const choice = data.choices?.[0];
        const assistantMsg = choice?.message;

        if (!assistantMsg) {
          throw new Error("Resposta vazia do OpenRouter");
        }

        const toolCalls = assistantMsg.tool_calls;
        if (!toolCalls?.length) {
          const text =
            assistantMsg.content?.trim() ||
            "Pronto! Posso ajudar com mais alguma coisa?";
          if (model !== models[0]) {
            console.info(`[openrouter-agent] OK com modelo: ${model}`);
          }
          return { message: text, toolResults };
        }

        currentMessages.push({
          role: "assistant",
          content: assistantMsg.content ?? null,
          tool_calls: toolCalls,
        });

        for (const call of toolCalls) {
          const args = parseToolArgs(call.function.arguments);
          const result = await executeAgentTool(
            call.function.name,
            args,
            userId,
          );
          toolResults.push(result);
          currentMessages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(result),
          });
        }
      }

      return {
        message: "Limite de etapas do agente atingido. Tente um pedido mais simples.",
        toolResults,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${model}: ${msg.slice(0, 80)}`);
      console.warn(`[openrouter-agent] ${model} falhou:`, msg.slice(0, 160));
      if (!isRetryableModelError(msg)) break;
    }
  }

  const hint = process.env.OPENROUTER_MODEL?.includes("qwen-2.5")
    ? " Remova ou atualize OPENROUTER_MODEL no .env (modelo antigo)."
    : "";

  return {
    message:
      `Não consegui contactar o OpenRouter.${hint} Tente OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free\n` +
      errors.slice(-2).join("\n"),
    toolResults,
  };
}
