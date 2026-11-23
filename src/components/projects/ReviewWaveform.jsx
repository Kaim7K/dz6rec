import React, { useEffect, useState } from "react";

async function readPeaks(url, signal) {
  const limit = 24 * 1024 * 1024;
  const response = await fetch(url, { signal });
  if (!response.ok || !response.body || Number(response.headers.get("content-length")) > limit) {
    await response.body?.cancel();
    throw new Error("Áudio indisponível para análise.");
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) throw new Error("Arquivo acima do limite de 24 MB.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  signal.throwIfAborted();
  const context = new OfflineAudioContext(1, 1, 16000);
  const audio = await context.decodeAudioData(bytes.buffer);
  const peaks = Array.from({ length: 72 }, () => 0);
  for (let channel = 0; channel < audio.numberOfChannels; channel++) {
    const samples = audio.getChannelData(channel);
    for (let index = 0; index < samples.length; index++) {
      const bin = Math.floor(index * peaks.length / samples.length);
      peaks[bin] = Math.max(peaks[bin], Math.abs(samples[index]));
    }
  }
  const max = Math.max(0.01, ...peaks);
  return peaks.map(peak => peak / max);
}

export default function ReviewWaveform({ url, audioRef }) {
  const [request, setRequest] = useState(0);
  const [peaks, setPeaks] = useState(null);
  const [error, setError] = useState(false);
  const [position, setPosition] = useState(0);
  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    setError(false);
    readPeaks(url, controller.signal)
      .then(result => { if (!controller.signal.aborted) setPeaks(result); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [request, url]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !peaks) return;
    const syncPosition = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) setPosition(audio.currentTime / audio.duration);
    };
    syncPosition();
    audio.addEventListener("timeupdate", syncPosition);
    return () => audio.removeEventListener("timeupdate", syncPosition);
  }, [audioRef, peaks]);

  if (!peaks) return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <button type="button" disabled={!!request && !error} onClick={() => setRequest(value => value + 1)} className="dz-ghost-button">
        {request && !error ? "Gerando forma de onda…" : error ? "Tentar nova análise" : "Mostrar forma de onda"}
      </button>
      {error && <span role="status" className="text-muted-foreground">Forma de onda indisponível para este arquivo. Use o player para navegar.</span>}
    </div>
  );

  const seek = fraction => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(audio.duration)) {
      audio.currentTime = fraction * audio.duration;
      setPosition(fraction);
    }
  };
  return (
    <div className="relative rounded border border-white/10 bg-black/30 focus-within:ring-2 focus-within:ring-primary">
      <div aria-hidden="true" className="flex h-14 items-center gap-px px-2">
        {peaks.map((peak, index) => <span key={index} className={`min-w-0 flex-1 rounded-full ${index / peaks.length < position ? "bg-primary" : "bg-white/35"}`} style={{ height: `${Math.max(6, peak * 85)}%` }} />)}
      </div>
      <input type="range" min={0} max={100} value={Math.round(position * 100)} aria-label="Navegar pela forma de onda" onChange={event => seek(event.currentTarget.valueAsNumber / 100)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
    </div>
  );
}
