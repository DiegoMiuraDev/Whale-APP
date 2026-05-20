"use client";

import { AgentChat } from "@/components/agent/agent-chat";
import { LyricsSearch } from "@/components/agent/lyrics-search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgentPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Agente Whale</h1>
        <p className="text-whale-muted">
          Identifique por áudio, busque no Spotify por trecho de letra ou
          converse com o agente Gemini
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chat + identificação</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentChat />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Busca por letra</CardTitle>
          </CardHeader>
          <CardContent>
            <LyricsSearch />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
