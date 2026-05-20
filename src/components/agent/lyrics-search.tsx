"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/context/player-context";
import type { SpotifyTrack } from "@/lib/spotify";

type Match = {
  lyric: {
    track_name: string;
    artist_name: string;
    snippet?: string;
  };
  spotify: SpotifyTrack | null;
};

export function LyricsSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const { setNowPlaying } = usePlayer();

  const search = async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/lyrics-search?${new URLSearchParams({ q: query })}`,
      );
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Cole um trecho da letra…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <Button onClick={search} disabled={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <ul className="space-y-2">
        {results.map((r, i) => (
          <li
            key={i}
            className="flex items-center justify-between rounded-lg border border-whale-border bg-whale-surface p-3"
          >
            <div>
              <p className="font-medium">
                {r.spotify?.name ?? r.lyric.track_name}
              </p>
              <p className="text-sm text-whale-muted">
                {r.spotify?.artists.map((a) => a.name).join(", ") ??
                  r.lyric.artist_name}
              </p>
            </div>
            {r.spotify && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setNowPlaying({
                    id: r.spotify!.id,
                    name: r.spotify!.name,
                    artist: r.spotify!.artists.map((a) => a.name).join(", "),
                    image: r.spotify!.album.images[0]?.url,
                    spotifyUrl: r.spotify!.external_urls.spotify,
                    previewUrl: r.spotify!.preview_url,
                  })
                }
              >
                Tocar
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
