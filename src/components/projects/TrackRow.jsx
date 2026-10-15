import React, { useEffect, useRef, useState } from "react";
import { apiClient } from "@/api/appClient";
import { usePlayer } from "@/lib/playerContext";
import { uploadFile, logActivity, STATUS, STATUS_TONE } from "@/lib/music";
import { Pause, Play, Plus, MoreHorizontal, GripVertical, Download } from "lucide-react";
import dz6ProfileLogo from "@/assets/dz6-profile.png";

function Waveform({ pct = 0 }) {
  const bars = [18, 26, 34, 22, 38, 30, 16, 28, 42, 24, 35, 20, 30, 18, 40, 26, 32, 22, 36, 19, 28, 24, 34, 16, 30, 22, 38, 20, 32, 24];
  const active = Math.max(1, Math.round((pct / 100) * bars.length));

  return (
    <div className="flex h-8 items-center gap-0.5">
      {bars.map((height, index) => (
        <span
          key={`${height}-${index}`}
          className={`w-0.5 rounded-full ${index < active ? "bg-primary" : "bg-white/20"}`}
          style={{ height }}
        />
      ))}
    </div>
  );
}

export default function TrackRow({ track, project, queue, index, provided, progressPct = 0 }) {
  const player = usePlayer();
  const isCurrent = player.current?.track?.id === track.id;
  const [versions, setVersions] = useState([]);
  const [menu, setMenu] = useState(false);
  const fileRef = useRef(null);
  const tone = STATUS_TONE[project?.status] || STATUS_TONE.rascunho;

  useEffect(() => { apiClient.entities.TrackVersion.filter({ track_id: track.id }).then(setVersions); }, [track.id]);

  const play = () => { if (isCurrent) player.togglePlay(); else player.play(track, project, queue); };
  const switchVersion = async (v) => {
    await apiClient.entities.Track.update(track.id, { audio_url: v.audio_url, version_label: v.name });
    setMenu(false);
    if (isCurrent) player.play({ ...track, audio_url: v.audio_url, version_label: v.name }, project, queue);
  };
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
  const addVersion = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await uploadFile(f);
    const name = `Mix ${versions.length + 1}`;
    await apiClient.entities.TrackVersion.create({ track_id: track.id, name, audio_url: url });
    await apiClient.entities.Track.update(track.id, { audio_url: url, version_label: name });
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(project.id, `Versão adicionada em ${track.name}`, me?.full_name);
    setMenu(false);
  };

  return (
    <div ref={provided?.innerRef} {...(provided?.draggableProps || {})} className="group grid min-w-0 gap-3 border-b border-white/[0.055] px-3 py-3 transition-colors last:border-b-0 hover:bg-white/[0.025] lg:grid-cols-[3rem_minmax(0,1fr)_6rem_9rem_minmax(12rem,18rem)_2rem] lg:items-center lg:px-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button {...(provided?.dragHandleProps || {})} className="hidden shrink-0 cursor-grab touch-none text-white/18 opacity-0 transition group-hover:opacity-100 hover:text-white/55 active:cursor-grabbing lg:block" aria-label="Mover faixa">
          <GripVertical size={14} />
        </button>
        <button onClick={play} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-sm text-white/55 group-hover:bg-white/[0.04] group-hover:text-white">
          {isCurrent && player.isPlaying ? <Pause size={15} fill="currentColor" /> : <><span className="group-hover:hidden tabular-nums">{String(index + 1).padStart(2, "0")}</span><Play size={15} fill="currentColor" className="hidden group-hover:block" /></>}
        </button>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-white/[0.07] bg-black">
          {project?.cover_url ? <img src={project.cover_url} alt="" className="h-full w-full object-cover" /> : <img src={dz6ProfileLogo} alt="" className="h-full w-full object-cover opacity-90" />}
        </div>
        <div className="min-w-0">
          <p className={`truncate text-sm font-bold ${isCurrent ? "text-white" : "text-white/88"}`}>{track.name}</p>
          <p className="truncate text-xs text-muted-foreground">{[track.main_artist_name || project?.main_artist_name, track.featuring && `feat. ${track.featuring}`].filter(Boolean).join(" · ")}</p>
        </div>
      </div>

      <span className="hidden text-sm text-muted-foreground lg:block">{track.duration || track.duration_label || "03:24"}</span>
      <span className={`inline-flex w-fit items-center gap-2 rounded-md border px-2.5 py-1 text-xs ${tone.bg} ${tone.text} ${tone.border}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
        {STATUS[project?.status] || "Status"}
      </span>
      <div className="hidden items-center gap-3 lg:flex">
        <Waveform pct={progressPct} />
        <span className="text-sm font-bold tabular-nums text-white/78">{progressPct}%</span>
      </div>

      <div className="relative justify-self-end">
        <button onClick={() => setMenu(!menu)} className="rounded-lg p-1 text-muted-foreground hover:bg-white/5 hover:text-white"><MoreHorizontal size={16} /></button>
        {menu && <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-white/[0.08] bg-popover p-1.5 shadow-elev">
          {versions.map((v) => <button key={v.id} onClick={() => switchVersion(v)} className="block w-full rounded-md px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5">{v.name}</button>)}
          {track.audio_url && <button onClick={downloadTrack} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5"><Download size={13} />Baixar áudio</button>}
          <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5"><Plus size={13} />Nova versão</button>
        </div>}
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={addVersion} />
      </div>
    </div>
  );
}
