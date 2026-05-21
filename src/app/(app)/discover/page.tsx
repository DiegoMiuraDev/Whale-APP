"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrackList } from "@/components/player/track-list";
import type { SpotifyTrack } from "@/lib/spotify";

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/search?${new URLSearchParams({ q: query.trim() })}`,
      );
      const data = (await res.json()) as {
        tracks?: SpotifyTrack[];
        error?: string;
      };

      if (!res.ok) {
        setTracks([]);
        setError(data.error ?? "Erro ao buscar. Tente de novo.");
        return;
      }

      setTracks(data.tracks ?? []);
      if (data.error && (data.tracks?.length ?? 0) === 0) {
        setError(data.error);
      } else if (data.error) {
        setError(null);
      }
    } catch {
      setTracks([]);
      setError("Erro de rede. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Descobrir</h1>
        <p className="text-whale-muted">
          Busque no catálogo Spotify · clique em ▶ para preview ou player
          embutido
        </p>
      </div>

      <div className="flex max-w-xl gap-2">
        <Input
          placeholder="Artista, música, álbum…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          disabled={loading}
        />
        <Button onClick={search} disabled={loading || !query.trim()}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-whale-muted">Buscando…</p>
      ) : (
        <TrackList tracks={tracks} showEmpty={searched} />
      )}
    </div>
  );
}
