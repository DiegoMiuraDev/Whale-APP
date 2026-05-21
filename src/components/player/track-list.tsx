"use client";

import { Play } from "lucide-react";
import { usePlayer } from "@/context/player-context";
import type { SpotifyTrack } from "@/lib/spotify";
import { Button } from "@/components/ui/button";

export function TrackList({
  tracks,
  showEmpty = true,
}: {
  tracks: SpotifyTrack[];
  showEmpty?: boolean;
}) {
  const { setNowPlaying } = usePlayer();

  if (tracks.length === 0) {
    if (!showEmpty) return null;
    return (
      <p className="py-8 text-center text-sm text-whale-muted">
        Nenhuma faixa encontrada
      </p>
    );
  }

  return (
    <ul className="divide-y divide-whale-border">
      {tracks.map((track, i) => (
        <li
          key={track.id}
          className="group flex items-center gap-4 rounded-lg px-2 py-2 hover:bg-whale-elevated/50"
        >
          <span className="w-6 text-sm text-whale-muted">{i + 1}</span>
          {track.album.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={track.album.images[0].url}
              alt=""
              className="h-12 w-12 rounded object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded bg-whale-elevated" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{track.name}</p>
            <p className="truncate text-sm text-whale-muted">
              {track.artists.map((a) => a.name).join(", ")}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="opacity-70 group-hover:opacity-100"
            title={
              track.preview_url
                ? "Tocar preview (~30s)"
                : "Abrir player Spotify embaixo"
            }
            onClick={() => {
              const playing = {
                id: track.id,
                name: track.name,
                artist: track.artists.map((a) => a.name).join(", "),
                image: track.album.images[0]?.url,
                spotifyUrl: track.external_urls.spotify,
                previewUrl: track.preview_url,
              };
              setNowPlaying(playing);
            }}
          >
            <Play className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
