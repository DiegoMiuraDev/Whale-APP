"use client";

import { ExternalLink, Pause, Play, X } from "lucide-react";
import { usePlayer } from "@/context/player-context";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

export function PlayerBar() {
  const { nowPlaying, setNowPlaying } = usePlayer();
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasPreview = Boolean(nowPlaying?.previewUrl);
  const useEmbed = Boolean(nowPlaying && !hasPreview && nowPlaying.id);

  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    queueMicrotask(() => {
      setPlaying(false);
      setPlayError(null);
    });
  }, [nowPlaying?.id]);

  const closePlayer = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
    setPlayError(null);
    setNowPlaying(null);
  };

  const togglePreview = async () => {
    if (!nowPlaying?.previewUrl) return;
    setPlayError(null);

    let audio = audioRef.current;
    if (!audio || !audio.src.endsWith(nowPlaying.previewUrl)) {
      audio = new Audio(nowPlaying.previewUrl);
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        setPlaying(false);
        setPlayError("Preview indisponível para esta faixa.");
      };
      audioRef.current = audio;
    }

    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        await audio.play();
        setPlaying(true);
      }
    } catch {
      setPlaying(false);
      setPlayError("O navegador bloqueou o áudio. Clique em play de novo.");
    }
  };

  if (!nowPlaying) {
    return null;
  }

  return (
    <footer className="border-t border-whale-border bg-whale-player">
      <div className="grid h-[90px] grid-cols-3 items-center px-6">
        <div className="flex min-w-0 items-center gap-3">
          {nowPlaying.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={nowPlaying.image}
              alt=""
              className="h-14 w-14 rounded-md object-cover"
            />
          ) : (
            <div className="h-14 w-14 rounded-md bg-whale-elevated" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{nowPlaying.name}</p>
            <p className="truncate text-sm text-whale-muted">
              {nowPlaying.artist}
            </p>
            <p className="text-xs text-whale-muted">
              {hasPreview
                ? "Preview ~30s"
                : useEmbed
                  ? "Player Spotify (preview)"
                  : "Sem preview nesta faixa"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1">
          {hasPreview ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={togglePreview}
              title="Tocar preview de 30 segundos"
            >
              {playing ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
          ) : useEmbed ? (
            <p className="text-xs text-whale-muted">Use o player abaixo ▼</p>
          ) : (
            <Button size="icon" variant="ghost" disabled>
              <Play className="h-5 w-5 opacity-40" />
            </Button>
          )}
          {playError && (
            <p className="max-w-[200px] text-center text-xs text-red-400">
              {playError}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          {nowPlaying.spotifyUrl && (
            <Button variant="secondary" size="sm" asChild>
              <a
                href={nowPlaying.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir no Spotify
              </a>
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={closePlayer}
            title="Fechar player"
            aria-label="Fechar player"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {useEmbed && (
        <div className="border-t border-whale-border px-4 pb-3 pt-2">
          <iframe
            title={`Spotify: ${nowPlaying.name}`}
            src={`https://open.spotify.com/embed/track/${nowPlaying.id}?utm_source=whale&theme=0`}
            width="100%"
            height="80"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg"
          />
        </div>
      )}
    </footer>
  );
}
