"use client";

import { useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IdentifiedTrack } from "@/lib/audd";

type Props = {
  onResult: (result: IdentifiedTrack) => void;
};

export function AudioRecorder({ onResult }: Props) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await identify(blob);
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
      setTimeout(() => {
        if (recorder.state === "recording") stop();
      }, 8000);
    } catch {
      setError("Permissão de microfone necessária");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const identify = async (blob: Blob) => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("audio", blob, "recording.webm");
      const res = await fetch("/api/identify", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      onResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na identificação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        size="lg"
        variant={recording ? "secondary" : "default"}
        onClick={recording ? stop : start}
        disabled={loading}
        className="h-16 w-16 rounded-full"
      >
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : recording ? (
          <Square className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
      <p className="text-sm text-whale-muted">
        {recording
          ? "Ouvindo… (até 8s)"
          : loading
            ? "Identificando…"
            : "Toque para identificar música"}
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
