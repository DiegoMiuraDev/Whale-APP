export type IdentifiedTrack = {
  title: string;
  artist: string;
  album: string;
  release_date?: string;
  spotify?: { id: string; uri: string; external_url: string };
  apple_music?: { id: string; url: string };
};

export async function identifyAudio(
  audioBuffer: Buffer,
  filename = "sample.webm",
): Promise<IdentifiedTrack | null> {
  const token = process.env.AUDD_API_TOKEN;

  if (!token) {
    return mockIdentification();
  }

  const form = new FormData();
  form.append("api_token", token);
  form.append("return", "spotify,apple_music");
  form.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: "audio/webm" }),
    filename,
  );

  const res = await fetch("https://api.audd.io/", {
    method: "POST",
    body: form,
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    status: string;
    result?: {
      title: string;
      artist: string;
      album: string;
      release_date?: string;
      spotify?: { id: string; uri: string; external_urls: { spotify: string } };
      apple_music?: { id: string; url: string };
    };
  };

  if (data.status !== "success" || !data.result) return null;

  const r = data.result;
  return {
    title: r.title,
    artist: r.artist,
    album: r.album,
    release_date: r.release_date,
    spotify: r.spotify
      ? {
          id: r.spotify.id,
          uri: r.spotify.uri,
          external_url: r.spotify.external_urls.spotify,
        }
      : undefined,
    apple_music: r.apple_music
      ? { id: r.apple_music.id, url: r.apple_music.url }
      : undefined,
  };
}

function mockIdentification(): IdentifiedTrack {
  const mocks = [
    {
      title: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      spotify: {
        id: "0VjIjW4GlUZAMYd2vXMi3b",
        uri: "spotify:track:0VjIjW4GlUZAMYd2vXMi3b",
        external_url: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b",
      },
    },
    {
      title: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night At The Opera",
      spotify: {
        id: "4u7Enebt0eM8A6aQ3qC1pN",
        uri: "spotify:track:4u7Enebt0eM8A6aQ3qC1pN",
        external_url: "https://open.spotify.com/track/4u7Enebt0eM8A6aQ3qC1pN",
      },
    },
  ];
  return mocks[Math.floor(Math.random() * mocks.length)];
}
