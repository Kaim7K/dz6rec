import React, { useEffect, useRef, useState } from "react";
import { apiClient } from "@/api/appClient";
import { usePlayer } from "@/lib/playerContext";
import { STATUS, STATUS_TONE } from "@/lib/music";
import TrackVersionsDialog from "./TrackVersionsDialog";
import { ReviewBadge } from "./ArtifactReviewDialog";
import { toast } from "@/components/ui/use-toast";
import { Check, Pause, Play, Plus, MoreHorizontal, GripVertical, Download } from "lucide-react";
import dz6ProfileLogo from "@/assets/dz6-profile.png";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

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

export default function TrackRow({ track, project, queue, index, provided, progressPct = 0, onChanged, defaultReviewerId }) {
  const player = usePlayer();
  const isCurrent = player.current?.track?.id === track.id;
  const [versions, setVersions] = useState([]);
  const [menu, setMenu] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [switching, setSwitching] = useState(false);
  const fileRef = useRef(null);
  const tone = STATUS_TONE[project?.status] || STATUS_TONE.rascunho;
  const currentVersion = track.current_version_id ? versions.find(row => row.id === track.current_version_id) : versions.find(row => row.audio_url === track.audio_url);
  const versionLabel = currentVersion?.name || track.version_label;
  const trackTitle = versionLabel?.trim() ? `${track.name} (${versionLabel.trim()})` : track.name;

  const refreshVersions = () => apiClient.entities.TrackVersion.filter({ track_id: track.id }).then(setVersions).catch(() => {});
  useEffect(() => { refreshVersions(); }, [track.id, track.audio_url, track.version_label]);

  const play = () => { if (isCurrent) player.togglePlay(); else player.play(track, project, queue); };
  const switchVersion = async (v) => {
    if (switching) return;
    setSwitching(true);
    try {
      const patch = { current_version_id: v.id, audio_url: v.audio_url, version_label: v.name };
      await apiClient.entities.Track.update(track.id, patch);
      onChanged?.();
      setMenu(false);
      if (isCurrent) player.play({ ...track, ...patch }, project, queue.map(row => row.id === track.id ? { ...row, ...patch } : row));
      toast({ title: "Versão atualizada", description: v.name });
    } catch (err) { toast({ variant: "destructive", title: "Não foi possível trocar a versão", description: err.message }); }
    finally { setSwitching(false); }
  };
  const downloadTrack = async () => {
    setMenu(false);
    if (!track.audio_url) return;
    try {
      const res = await fetch(track.audio_url);
      if (!res.ok) throw new Error("Falha no download");
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
    setPendingFile(f);
    setManagerOpen(true);
    e.target.value = "";
    setMenu(false);
  };

  return (
    <div ref={provided?.innerRef} {...(provided?.draggableProps || {})} className="dz-track-row group min-w-0 border-b border-white/[0.055] px-3 py-3 transition-colors last:border-b-0 hover:bg-white/[0.025]">
      <div className="dz-track-index flex items-center gap-1 text-sm text-muted-foreground">
        <button {...(provided?.dragHandleProps || {})} className="dz-track-drag shrink-0 cursor-grab touch-none text-white/35 transition hover:text-white/65 active:cursor-grabbing" aria-label="Mover faixa">
          <GripVertical size={14} />
        </button>
        <button onClick={play} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-sm text-white/55 group-hover:bg-white/[0.04] group-hover:text-white">
          {isCurrent && player.isPlaying ? <Pause size={15} fill="currentColor" /> : <><span className="group-hover:hidden tabular-nums">{String(index + 1).padStart(2, "0")}</span><Play size={15} fill="currentColor" className="hidden group-hover:block" /></>}
        </button>
      </div>

      <div className="dz-track-title flex min-w-0 items-center gap-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-white/[0.07] bg-black">
          {project?.cover_url ? <img src={project.cover_url} alt="" className="h-full w-full object-cover" /> : <img src={dz6ProfileLogo} alt="" className="h-full w-full object-cover opacity-90" />}
        </div>
        <div className="min-w-0">
          <p title={trackTitle} className={`truncate text-sm font-medium ${isCurrent ? "text-white" : "text-white/88"}`}>{trackTitle}</p>
          <p className="truncate text-xs text-muted-foreground">{[track.main_artist_name || project?.main_artist_name, track.featuring && `feat. ${track.featuring}`].filter(Boolean).join(" · ")}</p>
          {currentVersion?.review_status && <div className="mt-1"><ReviewBadge entity="TrackVersion" artifact={currentVersion} /></div>}
        </div>
      </div>

      <span className="dz-track-duration text-sm text-muted-foreground">{track.duration || track.duration_label || "—"}</span>
      <span className={`dz-track-status inline-flex w-fit items-center gap-2 text-xs ${tone.text}`}>
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
        {STATUS[project?.status] || "Status"}
      </span>
      <div className="dz-track-progress items-center gap-3">
        <div className="dz-track-waveform"><Waveform pct={progressPct} /></div>
        <span className="text-sm font-bold tabular-nums text-white/78">{progressPct}%</span>
      </div>

      <div className="dz-track-menu relative justify-self-end">
        <DropdownMenu open={menu} onOpenChange={setMenu}>
          <DropdownMenuTrigger asChild>
            <button type="button" disabled={switching} aria-label={`Opções da faixa ${track.name}`} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-white"><MoreHorizontal size={16} /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} collisionPadding={12} className="max-h-[var(--radix-dropdown-menu-content-available-height)] w-52 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-lg border-white/[0.12] p-1.5 shadow-elev">
            {versions.map((v) => <DropdownMenuItem key={v.id} onSelect={() => switchVersion(v)} disabled={switching} accentColor={currentVersion?.id === v.id ? "#34d399" : undefined} data-current={currentVersion?.id === v.id ? "true" : undefined} className="rounded-md px-3 py-2 text-xs text-white/80">{currentVersion?.id === v.id && <Check size={14} aria-hidden="true" />}<span className="min-w-0 truncate">{v.name}</span></DropdownMenuItem>)}
            <DropdownMenuItem onSelect={() => { setPendingFile(null); setManagerOpen(true); }} className="rounded-md px-3 py-2 text-xs text-white/80">Gerenciar versões</DropdownMenuItem>
            {track.audio_url && <DropdownMenuItem onSelect={downloadTrack} className="rounded-md px-3 py-2 text-xs text-white/80"><Download size={14} />Baixar áudio</DropdownMenuItem>}
            <DropdownMenuItem onSelect={() => fileRef.current?.click()} className="rounded-md px-3 py-2 text-xs text-white/80"><Plus size={14} />Nova versão</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={addVersion} />
      </div>
      {managerOpen && <TrackVersionsDialog track={track} project={project} queue={queue} defaultReviewerId={defaultReviewerId} initialFile={pendingFile} onClose={() => setManagerOpen(false)} onChanged={() => { refreshVersions(); onChanged?.(); }} />}
    </div>
  );
}
