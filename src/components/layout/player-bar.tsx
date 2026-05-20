"use client";

import { ExternalLink, Pause, Play } from "lucide-react";
import { usePlayer } from "@/context/player-context";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

export function PlayerBar() {
  const { nowPlaying } = usePlayer();
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    queueMicrotask(() => setPlaying(false));
  }, [nowPlaying?.id]);

  const togglePreview = () => {
    if (!nowPlaying?.previewUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(nowPlaying.previewUrl);
      audioRef.current.onended = () => setPlaying(false);
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  if (!nowPlaying) {
    return (
      <footer className="flex h-[90px] items-center justify-center border-t border-whale-border bg-whale-player px-6 text-sm text-whale-muted">
        Selecione uma música para ver detalhes e preview de 30s
      </footer>
    );
  }

  return (
    <footer className="grid h-[90px] grid-cols-3 items-center border-t border-whale-border bg-whale-player px-6">
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
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          size="icon"
          variant="ghost"
          onClick={togglePreview}
          disabled={!nowPlaying.previewUrl}
          title={
            nowPlaying.previewUrl
              ? "Preview 30s"
              : "Preview indisponível — abra no Spotify"
          }
        >
          {playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="flex justify-end">
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
      </div>
    </footer>
  );
}
