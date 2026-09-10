import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePlayer } from "@/lib/playerContext";
import { uploadFile, logActivity } from "@/lib/music";
import { Pause, Play, Plus, MoreHorizontal, GripVertical, Download } from "lucide-react";

export default function TrackRow({ track, project, queue, index, provided }) {
  const player = usePlayer();
  const isCurrent = player.current?.track?.id === track.id;
  const [versions, setVersions] = useState([]);
  const [menu, setMenu] = useState(false);
  const fileRef = useRef(null);
  useEffect(() => { base44.entities.TrackVersion.filter({ track_id: track.id }).then(setVersions); }, [track.id]);
  const play = () => { if (isCurrent) player.togglePlay(); else player.play(track, project, queue); };
  const switchVersion = async (v) => { await base44.entities.Track.update(track.id, { audio_url: v.audio_url, version_label: v.name }); setMenu(false); if (isCurrent) player.play({ ...track, audio_url: v.audio_url, version_label: v.name }, project, queue); };
  const downloadTrack = async () => {
    setMenu(false);
    if (!track.audio_url) return;
    try {
      const res = await fetch(track.audio_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${track.name} (${track.version_label || "Demo"})`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(track.audio_url, "_blank");
    }
  };
  const addVersion = async (e) => { const f = e.target.files?.[0]; if (!f) return; const url = await uploadFile(f); const name = `Mix ${versions.length + 1}`; await base44.entities.TrackVersion.create({ track_id: track.id, name, audio_url: url }); await base44.entities.Track.update(track.id, { audio_url: url, version_label: name }); const me = await base44.auth.me().catch(() => null); await logActivity(project.id, `Versão adicionada em ${track.name}`, me?.full_name); setMenu(false); };
  return (
    <div ref={provided?.innerRef} {...(provided?.draggableProps || {})} className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-white/[0.04]">
      <button {...(provided?.dragHandleProps || {})} className="shrink-0 cursor-grab touch-none text-white/25 opacity-0 transition group-hover:opacity-100 hover:text-white/60 active:cursor-grabbing" aria-label="Mover faixa">
        <GripVertical size={15} />
      </button>
      <button onClick={play} className="grid h-7 w-7 shrink-0 place-items-center text-sm text-white/40 group-hover:text-white">
        {isCurrent && player.isPlaying ? <Pause size={15} fill="currentColor" /> : <><span className="group-hover:hidden tabular-nums">{String(index + 1).padStart(2, "0")}</span><Play size={15} fill="currentColor" className="hidden group-hover:block" /></>}
      </button>
      <div className="min-w-0 flex-1"><p className={`truncate text-sm ${isCurrent ? "text-white" : "text-white/85"}`}>{track.name}</p><p className="truncate text-2xs text-white/40">{[track.main_artist_name, track.featuring && `feat. ${track.featuring}`].filter(Boolean).join(" · ")}</p></div>
      <span className="rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-2xs text-white/55">{track.version_label || "Demo"}</span>
      <div className="relative">
        <button onClick={() => setMenu(!menu)} className="rounded-lg p-1 text-white/40 hover:bg-white/5 hover:text-white"><MoreHorizontal size={16} /></button>
        {menu && <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-white/[0.08] bg-popover p-1.5 shadow-elev">
          {versions.map((v) => <button key={v.id} onClick={() => switchVersion(v)} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5">{v.name}</button>)}
          {track.audio_url && <button onClick={downloadTrack} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5"><Download size={13} />Baixar áudio</button>}
          <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5"><Plus size={13} />Nova versão</button>
        </div>}
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={addVersion} />
      </div>
    </div>
  );
}