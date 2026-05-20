"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TempPlaylistForm } from "@/components/playlist/temp-playlist-form";
import type { SpotifyTrack } from "@/lib/spotify";

type TempPlaylist = {
  id: string;
  name: string;
  spotifyPlaylistId: string;
  expiresAt: string;
};

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
    const stored = sessionStorage.getItem("whale:selectedTracks");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as SpotifyTrack[];
      queueMicrotask(() => setSelectedTracks(parsed));
    } catch {
      /* ignore */
    }
  }, []);

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
          Temporárias criadas pelo Whale — expiram automaticamente
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TempPlaylistForm selectedTracks={selectedTracks} onCreated={load} />

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
                Nenhuma playlist temporária. Use{" "}
                <Link href="/discover" className="text-whale-accent underline">
                  Descobrir
                </Link>{" "}
                para buscar faixas e salve em sessionStorage, ou peça ao{" "}
                <Link href="/agent" className="text-whale-accent underline">
                  Agente
                </Link>
                .
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

      <p className="text-xs text-whale-muted">
        Dica: em Descobrir, selecione faixas com o player; para persistir na
        criação de playlist temporária manual, salve URIs via agente ou API.
        O cron em /api/cron/expire-playlists remove playlists expiradas.
      </p>
    </div>
  );
}
