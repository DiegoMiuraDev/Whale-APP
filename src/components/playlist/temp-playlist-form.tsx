"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SpotifyTrack } from "@/lib/spotify";

const HOURS = [
  { label: "1 hora", value: 1 },
  { label: "24 horas", value: 24 },
  { label: "7 dias", value: 168 },
];

type Props = {
  selectedTracks: SpotifyTrack[];
  onCreated: () => void;
};

export function TempPlaylistForm({ selectedTracks, onCreated }: Props) {
  const [name, setName] = useState("Whale — evento");
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (selectedTracks.length === 0) {
      setError("Marque ao menos uma faixa na busca acima");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/playlists/temporary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          trackUris: selectedTracks.map((t) => t.uri),
          hours,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err =
          typeof data.error === "string"
            ? data.error
            : "Erro ao criar playlist";
        throw new Error(err);
      }
      setName("Whale — evento");
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-whale-border bg-whale-surface p-5">
      <h3 className="font-semibold">Nova playlist temporária</h3>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome da playlist"
      />
      <div className="flex flex-wrap gap-2">
        {HOURS.map((h) => (
          <Button
            key={h.value}
            size="sm"
            variant={hours === h.value ? "default" : "secondary"}
            onClick={() => setHours(h.value)}
          >
            {h.label}
          </Button>
        ))}
      </div>
      <p className="text-sm text-whale-muted">
        {selectedTracks.length} faixa(s) selecionada(s)
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button onClick={create} disabled={loading} className="w-full">
        {loading ? "Criando…" : "Criar no Spotify"}
      </Button>
    </div>
  );
}
