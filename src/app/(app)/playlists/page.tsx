"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TempPlaylistForm } from "@/components/playlist/temp-playlist-form";
import { PlaylistTrackPicker } from "@/components/playlist/playlist-track-picker";
import type { SpotifyTrack } from "@/lib/spotify";

type TempPlaylist = {
  id: string;
  name: string;
  spotifyPlaylistId: string;
  expiresAt: string;
};

const STORAGE_KEY = "whale:selectedTracks";

export default function PlaylistsPage() {
  const [tempPlaylists, setTempPlaylists] = useState<TempPlaylist[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<SpotifyTrack[]>([]);

  const load = () => {
    fetch("/api/playlists/temporary")
      .then((r) => r.json())
      .then((d) => setTempPlaylists(d.playlists ?? []));
  };

  useEffect(() => {
    load();
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as SpotifyTrack[];
      queueMicrotask(() => setSelectedTracks(parsed));
    } catch {
      /* ignore */
    }
  }, []);

  const handleSelectionChange = (tracks: SpotifyTrack[]) => {
    setSelectedTracks(tracks);
  };

  const handleCreated = () => {
    setSelectedTracks([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    load();
  };

  const formatExpiry = useCallback((iso: string, now: number) => {
    const d = new Date(iso);
    const diff = d.getTime() - now;
    if (diff < 0) return "Expirada";
    const h = Math.floor(diff / 3600000);
    if (h < 24) return `${h}h restantes`;
    return `${Math.floor(h / 24)}d restantes`;
  }, []);

  const [now] = useState(() => Date.now());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Playlists</h1>
        <p className="text-whale-muted">
          Busque faixas, marque com checkbox e crie uma playlist temporária
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <PlaylistTrackPicker
            selectedTracks={selectedTracks}
            onSelectionChange={handleSelectionChange}
          />
          <TempPlaylistForm
            selectedTracks={selectedTracks}
            onCreated={handleCreated}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              Ativas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tempPlaylists.length === 0 ? (
              <p className="text-sm text-whale-muted">
                Nenhuma playlist temporária ainda. Selecione faixas ao lado e
                clique em Criar no Spotify.
              </p>
            ) : (
              tempPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  className="flex items-center justify-between rounded-lg border border-whale-border p-3"
                >
                  <div>
                    <p className="font-medium">{pl.name}</p>
                    <Badge variant="temp" className="mt-1">
                      {formatExpiry(pl.expiresAt, now)}
                    </Badge>
                  </div>
                  <a
                    href={`https://open.spotify.com/playlist/${pl.spotifyPlaylistId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-whale-muted hover:text-white"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
