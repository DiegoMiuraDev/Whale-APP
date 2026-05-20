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

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?${new URLSearchParams({ q: query })}`,
      );
      const data = await res.json();
      setTracks(data.tracks ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Descobrir</h1>
        <p className="text-whale-muted">
          Busque no catálogo Spotify conectado à sua conta
        </p>
      </div>

      <div className="flex max-w-xl gap-2">
        <Input
          placeholder="Artista, música, álbum…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <Button onClick={search} disabled={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <TrackList tracks={tracks} />
    </div>
  );
}
