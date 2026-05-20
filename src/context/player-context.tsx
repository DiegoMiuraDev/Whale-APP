"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type NowPlaying = {
  id: string;
  name: string;
  artist: string;
  image?: string;
  spotifyUrl?: string;
  previewUrl?: string | null;
};

type PlayerContextValue = {
  nowPlaying: NowPlaying | null;
  setNowPlaying: (track: NowPlaying | null) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);

  return (
    <PlayerContext.Provider value={{ nowPlaying, setNowPlaying }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
