"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AudioRecorder } from "@/components/agent/audio-recorder";
import type { IdentifiedTrack } from "@/lib/audd";

type Message = { role: "user" | "assistant"; content: string };

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou o agente Whale. Posso identificar músicas pelo microfone, buscar por letra ou montar playlists — inclusive temporárias. O que você quer ouvir?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string, audioBase64?: string) => {
    if (!text.trim() && !audioBase64) return;
    const userMsg: Message = {
      role: "user",
      content: text || "[áudio enviado para identificação]",
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, audioBase64 }),
      });
      const data = await res.json();
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            data.message ??
            "Erro ao contactar o agente. Tente novamente.",
        },
      ]);
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Erro de rede ao contactar o agente. Tente novamente.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onIdentify = (result: IdentifiedTrack) => {
    const spotifyLink = result.spotify?.external_url
      ? ` Abrir: ${result.spotify.external_url}`
      : "";
    const text = `Identifiquei a música "${result.title}" de ${result.artist} (${result.album}).${spotifyLink} O que você quer fazer com ela?`;
    send(text);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <AudioRecorder
        onResult={(r) => {
          onIdentify(r);
        }}
      />

      <ScrollArea className="h-[400px] rounded-xl border border-whale-border bg-whale-surface/50 p-4">
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-whale-accent text-black"
                    : "bg-whale-elevated text-white"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-whale-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Pensando…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Peça uma playlist, busque um artista…"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
