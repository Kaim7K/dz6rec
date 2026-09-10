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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[#0c0808]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 sm:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/[0.06]">{cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={18} className="text-white/25" />}</div>
          <div className="min-w-0"><p className="truncate text-sm font-medium">{track.name}</p><p className="truncate text-xs text-white/40">{track.main_artist_name || project?.main_artist_name || "Artista"}</p></div>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={() => p.setShuffle(!p.shuffle)} className={p.shuffle ? "text-primary" : "text-white/40 hover:text-white"}><Shuffle size={16} /></button>
            <button onClick={p.prev} className="text-white/65 hover:text-white"><SkipBack size={18} fill="currentColor" /></button>
            <button onClick={p.togglePlay} className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105">{p.isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}</button>
            <button onClick={p.next} className="text-white/65 hover:text-white"><SkipForward size={18} fill="currentColor" /></button>
            <button onClick={() => p.setRepeat(!p.repeat)} className={p.repeat ? "text-primary" : "text-white/40 hover:text-white"}>{p.repeat ? <Repeat1 size={16} /> : <Repeat size={16} />}</button>
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <span className="w-9 text-right text-2xs tabular-nums text-white/40">{fmt(p.progress)}</span>
            <input type="range" min={0} max={p.duration || 0} value={p.progress} step={0.1} onChange={(e) => p.seek(parseFloat(e.target.value))} className="h-1 flex-1 cursor-pointer appearance-none rounded-full" style={{ background: `linear-gradient(to right, #c20000 ${pct}%, rgba(255,255,255,0.12) ${pct}%)` }} />
            <span className="w-9 text-2xs tabular-nums text-white/40">{fmt(p.duration)}</span>
          </div>
        </div>
        <div className="hidden flex-1 items-center justify-end gap-2 sm:flex">
          <Volume2 size={16} className="text-white/40" />
          <input type="range" min={0} max={1} value={p.volume} step={0.01} onChange={(e) => p.setVolume(parseFloat(e.target.value))} className="h-1 w-24 cursor-pointer appearance-none rounded-full" style={{ background: `linear-gradient(to right, #fff ${p.volume * 100}%, rgba(255,255,255,0.12) ${p.volume * 100}%)` }} />
        </div>
      </div>
    </div>
  );
}