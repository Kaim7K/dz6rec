import React from "react";
import { usePlayer } from "@/lib/playerContext";
import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, Image as ImageIcon } from "lucide-react";

const fmt = (s) => { if (!s || isNaN(s)) return "0:00"; const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, "0")}`; };

export default function Player() {
  const p = usePlayer();
  if (!p.current) return null;
  const { track, project } = p.current;
  const cover = project?.cover_url;
  const pct = p.duration ? (p.progress / p.duration) * 100 : 0;
  return (
    <div className="dz-player fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[#0c0808]/95 px-4 py-3 backdrop-blur-xl sm:px-6" role="region" aria-label="Player de áudio">
      <div className="dz-player-layout mx-auto max-w-[1600px]">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/[0.06]">{cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={18} className="text-muted-foreground" />}</div>
          <div className="min-w-0"><p className="truncate text-sm font-medium">{track.name}{track.version_label ? ` (${track.version_label})` : ""}</p><p className="truncate text-xs text-muted-foreground">{track.main_artist_name || project?.main_artist_name || "Artista"}</p></div>
        </div>
        <div className="flex min-w-0 flex-col items-center gap-1.5 sm:flex-1">
          <div className="flex items-center gap-2">
            <button aria-label="Reprodução aleatória" aria-pressed={p.shuffle} onClick={() => p.setShuffle(!p.shuffle)} className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${p.shuffle ? "text-red-300" : "text-muted-foreground hover:text-white"}`}><Shuffle size={16} /></button>
            <button aria-label="Faixa anterior" onClick={p.prev} className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-white/65 hover:text-white"><SkipBack size={18} fill="currentColor" /></button>
            <button aria-label={p.isPlaying ? "Pausar" : "Reproduzir áudio"} onClick={p.togglePlay} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105">{p.isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}</button>
            <button aria-label="Próxima faixa" onClick={p.next} className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-white/65 hover:text-white"><SkipForward size={18} fill="currentColor" /></button>
            <button aria-label="Repetir faixa" aria-pressed={p.repeat} onClick={() => p.setRepeat(!p.repeat)} className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${p.repeat ? "text-red-300" : "text-muted-foreground hover:text-white"}`}>{p.repeat ? <Repeat1 size={16} /> : <Repeat size={16} />}</button>
          </div>
          <div className="hidden w-full max-w-md items-center gap-2 sm:flex">
            <span className="w-9 text-right text-2xs tabular-nums text-muted-foreground">{fmt(p.progress)}</span>
            <input aria-label="Posição da reprodução" type="range" min={0} max={p.duration || 0} value={p.progress} step={0.1} onChange={(e) => p.seek(parseFloat(e.target.value))} className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full" style={{ background: `linear-gradient(to right, #c20000 ${pct}%, rgba(255,255,255,0.12) ${pct}%)` }} />
            <span className="w-9 text-2xs tabular-nums text-muted-foreground">{fmt(p.duration)}</span>
          </div>
        </div>
        <div className="hidden flex-1 items-center justify-end gap-2 sm:flex">
          <Volume2 size={16} className="text-muted-foreground" />
          <input aria-label="Volume" type="range" min={0} max={1} value={p.volume} step={0.01} onChange={(e) => p.setVolume(parseFloat(e.target.value))} className="h-1 w-24 cursor-pointer appearance-none rounded-full" style={{ background: `linear-gradient(to right, #fff ${p.volume * 100}%, rgba(255,255,255,0.12) ${p.volume * 100}%)` }} />
        </div>
      </div>
    </div>
  );
}
