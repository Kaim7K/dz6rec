import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import { usePlayer } from "@/lib/playerContext";
import { uploadFile, logActivity } from "@/lib/music";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Field from "@/components/ui/form-field";
import FileField from "@/components/ui/file-field";
import { toast } from "@/components/ui/use-toast";
import ArtifactReviewDialog, { ReviewBadge } from "./ArtifactReviewDialog";
import { Pencil } from "lucide-react";

export default function TrackVersionsDialog({ track, project, queue, defaultReviewerId, initialFile, onClose, onChanged }) {
  const player = usePlayer();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState(initialFile || null);
  const [progress, setProgress] = useState(0);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [review, setReview] = useState(null);
  const [activeId, setActiveId] = useState(track.current_version_id || "");
  const current = version => activeId ? version.id === activeId : version.audio_url === track.audio_url;
  const refresh = async () => {
    try {
      const rows = await apiClient.entities.TrackVersion.filter({ track_id: track.id });
      setVersions(rows.sort((a, b) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()));
      return rows;
    } catch (err) { setError(err.message || "Não foi possível carregar as versões."); throw err; }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh().catch(() => {}); }, [track.id]);
  useEffect(() => { setActiveId(track.current_version_id || ""); }, [track.current_version_id]);
  const sync = async () => { await refresh().catch(() => {}); onChanged?.(); };
  const activate = async version => {
    const patch = { current_version_id: version.id, audio_url: version.audio_url, version_label: version.name };
    await apiClient.entities.Track.update(track.id, patch);
    setActiveId(version.id);
    if (player.current?.track?.id === track.id) player.play({ ...track, ...patch }, project, queue.map(row => row.id === track.id ? { ...row, ...patch } : row));
  };
  const selectVersion = async version => {
    setBusy(version.id); setError("");
    try { await activate(version); onChanged?.(); toast({ title: "Versão atualizada", description: version.name }); }
    catch (err) { setError(err.message || "Não foi possível trocar a versão. Tente novamente."); }
    finally { setBusy(""); }
  };
  const rename = async (event, version) => {
    event.preventDefault();
    const next = editName.trim();
    if (!next || busy) return;
    setBusy(version.id); setError("");
    try {
      await apiClient.entities.TrackVersion.update(version.id, { name: next });
      if (current(version)) await apiClient.entities.Track.update(track.id, { version_label: next });
      const me = await apiClient.auth.me().catch(() => null);
      await logActivity(project.id, `Versão renomeada em ${track.name}: ${version.name} → ${next}`, me?.full_name);
      setEditing(null); await sync(); toast({ title: "Nome da versão salvo" });
    } catch (err) { setError(err.message || "Não foi possível concluir a alteração. Tente salvar novamente."); }
    finally { setBusy(""); }
  };
  const upload = async event => {
    event.preventDefault();
    if (!file || busy) return;
    setBusy("upload"); setError(""); setProgress(0);
    let created;
    try {
      const audio_url = await uploadFile(file, { onProgress: setProgress });
      if (track.audio_url && !versions.some(version => version.audio_url === track.audio_url)) await apiClient.entities.TrackVersion.create({ track_id: track.id, name: track.version_label || "Versão anterior", audio_url: track.audio_url });
      created = await apiClient.entities.TrackVersion.create({ track_id: track.id, name: name.trim() || `Mix ${versions.length + 1}`, audio_url, original_filename: file.name });
      setFile(null); setName("");
      await activate(created);
      const me = await apiClient.auth.me().catch(() => null);
      await logActivity(project.id, `Versão adicionada em ${track.name}: ${created.name}`, me?.full_name);
      toast({ title: "Versão enviada", description: created.name });
    } catch (err) { setError(created ? "O arquivo foi salvo, mas não foi possível torná-lo atual. Use o botão Usar versão abaixo; não é necessário reenviar." : err.message || "Não foi possível enviar. O arquivo selecionado foi mantido para tentar novamente."); }
    finally { await sync(); setBusy(""); setProgress(0); }
  };
  if (review) return <ArtifactReviewDialog entity="TrackVersion" artifact={review} project={project} defaultReviewerId={defaultReviewerId} onClose={() => setReview(null)} onSaved={() => { sync(); }} />;
  return (
    <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Versões da faixa</DialogTitle><DialogDescription className="[overflow-wrap:anywhere]">{track.name} · selecione a versão atual e acompanhe as revisões.</DialogDescription></DialogHeader>
        {error && <p role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error} <button type="button" onClick={() => refresh().catch(() => {})} disabled={!!busy} className="underline">Atualizar lista</button></p>}
        <form onSubmit={upload} className="min-w-0 space-y-3 border-b border-white/[0.08] pb-5">
          <h3 className="text-sm font-semibold">Nova versão</h3>
          <Field label="Nome da nova versão"><Input value={name} disabled={!!busy} maxLength={120} onChange={event => setName(event.target.value)} placeholder={`Mix ${versions.length + 1}`} /></Field>
          <Field label="Arquivo da versão"><FileField value={file} onChange={setFile} disabled={!!busy} accept="audio/*" hint="O áudio atual permanece disponível no histórico." /></Field>
          <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-xs text-muted-foreground">{busy === "upload" ? `Enviando… ${Math.round(progress || 0)}%` : "Nomeie a versão para facilitar as revisões."}</p><Button type="submit" className="w-full sm:w-auto" disabled={!file || !!busy}>{busy === "upload" ? "Enviando..." : "Enviar versão"}</Button></div>
        </form>
        <section className="min-w-0 divide-y divide-white/[0.08]" aria-label="Lista de versões">
          {loading ? <p role="status" className="text-sm text-muted-foreground">Carregando versões...</p> : !versions.length ? <p className="text-sm text-muted-foreground">Nenhuma versão registrada. Envie o primeiro áudio acima.</p> : versions.map(version => <article key={version.id} className="min-w-0 space-y-3 py-4 first:pt-0 last:pb-0">
            <div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-semibold">{version.name}</p><div className="mt-1 flex flex-wrap items-center gap-3">{current(version) && <span className="text-xs font-semibold text-white">Versão atual</span>}<ReviewBadge entity="TrackVersion" artifact={version} /></div>{version.reviewer_name && <p className="mt-1 text-xs text-muted-foreground [overflow-wrap:anywhere]">Revisor: {version.reviewer_name}</p>}</div><button type="button" disabled={!!busy} aria-label={`Renomear ${version.name}`} onClick={() => { setEditing(version.id); setEditName(version.name); }} className="dz-icon-button shrink-0"><Pencil size={15} /></button></div>
            {editing === version.id && <form onSubmit={event => rename(event, version)} className="flex min-w-0 flex-wrap gap-2"><Input aria-label="Nome da versão" required maxLength={120} value={editName} onChange={event => setEditName(event.target.value)} disabled={!!busy} className="min-w-0 flex-1 basis-48" /><Button type="button" variant="ghost" disabled={!!busy} onClick={() => setEditing(null)}>Cancelar</Button><Button type="submit" disabled={!!busy}>Salvar nome</Button></form>}
            <div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" className="px-2 text-xs" disabled={!!busy || current(version)} onClick={() => selectVersion(version)}>{current(version) ? "Atual" : "Usar versão"}</Button><Button type="button" variant="outline" className="px-2 text-xs" disabled={!!busy} onClick={() => setReview(version)}>Revisar versão</Button></div>
          </article>)}
        </section>
      </DialogContent>
    </Dialog>
  );
}
