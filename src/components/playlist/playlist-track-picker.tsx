"use client";

import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SpotifyTrack } from "@/lib/spotify";

const STORAGE_KEY = "whale:selectedTracks";

type Props = {
  selectedTracks: SpotifyTrack[];
  onSelectionChange: (tracks: SpotifyTrack[]) => void;
};

function persistSelection(tracks: SpotifyTrack[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
  } catch {
    /* ignore */
  }
}

export function PlaylistTrackPicker({
  selectedTracks,
  onSelectionChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const selectedIds = new Set(selectedTracks.map((t) => t.id));

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
      setResults(data.tracks ?? []);
      if ((data.tracks?.length ?? 0) === 0 && data.error) {
        setError(data.error);
      }
    } catch {
      setResults([]);
      setError("Erro ao buscar. Tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTrack = (track: SpotifyTrack) => {
    let next: SpotifyTrack[];
    if (selectedIds.has(track.id)) {
      next = selectedTracks.filter((t) => t.id !== track.id);
    } else {
      next = [...selectedTracks, track].slice(-50);
    }
    onSelectionChange(next);
    persistSelection(next);
  };

  const clearSelection = () => {
    onSelectionChange([]);
    persistSelection([]);
  };

  return (
    <div className="space-y-4 rounded-xl border border-whale-border bg-whale-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Adicionar faixas</h3>
        {selectedTracks.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={clearSelection}
          >
            <Trash2 className="h-4 w-4" />
            Limpar ({selectedTracks.length})
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Buscar música ou artista…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          disabled={loading}
        />
        <Button type="button" onClick={search} disabled={loading || !query.trim()}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {loading && (
        <p className="text-sm text-whale-muted">Buscando…</p>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <p className="text-sm text-whale-muted">Nenhuma faixa encontrada.</p>
      )}

      {results.length > 0 && (
        <ScrollArea className="h-[220px] rounded-lg border border-whale-border">
          <ul className="divide-y divide-whale-border p-1">
            {results.map((track) => {
              const checked = selectedIds.has(track.id);
              return (
                <li key={track.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-whale-elevated/60">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTrack(track)}
                      className="h-4 w-4 shrink-0 accent-whale-accent"
                    />
                    {track.album.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={track.album.images[0].url}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-whale-elevated" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{track.name}</p>
                      <p className="truncate text-xs text-whale-muted">
                        {track.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}

      {selectedTracks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-whale-muted">
            Selecionadas para a playlist ({selectedTracks.length})
          </p>
          <ul className="space-y-1">
            {selectedTracks.map((track) => (
              <li
                key={track.id}
                className="flex items-center justify-between gap-2 rounded-md bg-whale-elevated/50 px-2 py-1.5 text-sm"
              >
                <span className="min-w-0 truncate">
                  {track.name} — {track.artists.map((a) => a.name).join(", ")}
                </span>
                <button
                  type="button"
                  onClick={() => toggleTrack(track)}
                  className="shrink-0 text-xs text-whale-muted hover:text-white"
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
