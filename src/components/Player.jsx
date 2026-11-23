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
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/[0.08]">{cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={18} className="text-muted-foreground" />}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-5 sm:text-base" title={track.name}>{track.name}</p>
            <div className="mt-1 flex min-w-0 items-center gap-2">
              {track.version_label && <span title={track.version_label} className="max-w-[55%] shrink-0 truncate rounded-md bg-white/[0.08] px-1.5 py-0.5 text-xs text-white/90">{track.version_label}</span>}
              <p className="truncate text-xs text-muted-foreground">{track.main_artist_name || project?.main_artist_name || "Artista"}</p>
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-col items-center gap-1.5 sm:flex-1">
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Reprodução aleatória" aria-pressed={p.shuffle} onClick={() => p.setShuffle(!p.shuffle)} className="dz-icon-button h-10 w-10 aria-pressed:bg-red-500/10 aria-pressed:text-red-200"><Shuffle size={16} /></button>
            <button type="button" aria-label="Faixa anterior" onClick={p.prev} className="dz-icon-button h-10 w-10"><SkipBack size={18} fill="currentColor" /></button>
            <button aria-label={p.isPlaying ? "Pausar" : "Reproduzir áudio"} onClick={p.togglePlay} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105">{p.isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}</button>
            <button type="button" aria-label="Próxima faixa" onClick={p.next} className="dz-icon-button h-10 w-10"><SkipForward size={18} fill="currentColor" /></button>
            <button type="button" aria-label="Repetir faixa" aria-pressed={p.repeat} onClick={() => p.setRepeat(!p.repeat)} className="dz-icon-button h-10 w-10 aria-pressed:bg-red-500/10 aria-pressed:text-red-200">{p.repeat ? <Repeat1 size={16} /> : <Repeat size={16} />}</button>
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <span className="w-9 text-right text-2xs tabular-nums text-muted-foreground">{fmt(p.progress)}</span>
            <input aria-label="Posição da reprodução" aria-valuetext={`${fmt(p.progress)} de ${fmt(p.duration)}`} type="range" min={0} max={p.duration || 0} value={p.progress} step={0.1} onChange={(e) => p.seek(e.target.valueAsNumber)} className="h-4 min-w-0 flex-1 cursor-pointer accent-primary" style={{ background: `linear-gradient(to right, #c20000 ${pct}%, rgba(255,255,255,0.12) ${pct}%) center / 100% 0.25rem no-repeat` }} />
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
