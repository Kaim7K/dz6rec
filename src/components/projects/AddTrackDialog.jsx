import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Field from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import FileField from "@/components/ui/file-field";
import AudioStorageField from "./AudioStorageField";
import UploadError from "./UploadError";
import { apiClient } from "@/api/appClient";
import { uploadFile, logActivity } from "@/lib/music";
import { Loader2 } from "lucide-react";


export default function AddTrackDialog({ open, onClose, onCreated, project, trackCount, nextTrackNumber }) {
  const [form, setForm] = useState({ name: "", main_artist_name: project?.main_artist_name || "", featuring: "", version_label: "Demo 01", track_number: null, bpm: "", key: "", isrc: "", notes: "" });
  const [audio, setAudio] = useState(null);
  const [storage, setStorage] = useState("blob");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const isCollection = project.type === "album" || project.type === "ep";
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const name = form.name.trim();
    if (isCollection && !name) {
      setError("Informe o nome da faixa.");
      return;
    }
    setLoading(true); setUploadProgress(0); setError(""); setUploadError("");
    let sendingAudio = Boolean(audio);
    try {
      const trackName = name || project.name || "Faixa sem nome";
      let audio_url = "";
      if (audio) {
        setUploading(true);
        const onProgress = value => setUploadProgress(Math.max(0, Math.min(100, value || 0)));
        audio_url = storage === "drive" ? (await apiClient.drive.uploadAudio(audio, onProgress)).file_url : await uploadFile(audio, { onProgress });
        sendingAudio = false;
        setUploading(false);
      }
      const data = { ...form, name: trackName, project_id: project.id, audio_url, bpm: form.bpm ? Number(form.bpm) : undefined, track_number: Number(form.track_number ?? nextTrackNumber) };
      const track = await apiClient.entities.Track.create(data);
      if (audio_url) await apiClient.entities.TrackVersion.create({ track_id: track.id, name: form.version_label, audio_url });
      const me = await apiClient.auth.me().catch(() => null);
      await logActivity(project.id, `Faixa adicionada: ${trackName}`, me?.full_name);
      await apiClient.entities.Project.update(project.id, { track_count: trackCount + 1 });
      setAudio(null); setUploadProgress(0); set("track_number", null);
      if (isCollection) set("name", "");
      onCreated(); onClose();
    } catch (err) {
      setUploadProgress(0);
      if (sendingAudio) setUploadError(err.message || "Não foi possível enviar o áudio. O arquivo continua selecionado.");
      else setError(err.message || "Não foi possível salvar a faixa.");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!loading && !nextOpen) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar faixa</DialogTitle>
          <DialogDescription>Informe o essencial. Detalhes técnicos podem ser preenchidos depois.</DialogDescription>
        </DialogHeader>
        {error && <div role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nome"><Input required={isCollection} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={isCollection ? "Ex. Noite Clara" : project.name || "Ex. Noite Clara"} /></Field>
          <div className="dz-form-columns">
            <Field label="Artista principal"><Input value={form.main_artist_name} onChange={(e) => set("main_artist_name", e.target.value)} /></Field>
            <Field label="Nº da faixa"><Input type="number" value={form.track_number ?? nextTrackNumber} onChange={(e) => set("track_number", e.target.value)} /></Field>
          </div>
          <div className="dz-form-columns">
            <Field label="Participações"><Input value={form.featuring} onChange={(e) => set("featuring", e.target.value)} placeholder="Artistas convidados" /></Field>
            <Field label="Versão"><Input value={form.version_label} onChange={(e) => set("version_label", e.target.value)} placeholder="Demo 01, Mix 01..." /></Field>
          </div>
          <Field label="Arquivo de áudio">
            <FileField value={audio} disabled={loading} onChange={(file) => { setAudio(file); setUploadProgress(0); setUploadError(""); }} accept="audio/*" hint="MP3, WAV, FLAC..." />
            {(loading && audio) && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-2xs text-muted-foreground">
                  <span>{uploading ? "Enviando arquivo" : "Finalizando"}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </Field>
          {audio && <AudioStorageField value={storage} onChange={value => { setStorage(value); setUploadError(""); }} disabled={loading} />}
          <UploadError message={uploadError} />
          <p className="pt-1 text-2xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Detalhes opcionais</p>
          <div className="dz-form-columns">
            <Field label="BPM"><Input type="number" value={form.bpm} onChange={(e) => set("bpm", e.target.value)} /></Field>
            <Field label="Tom"><Input value={form.key} onChange={(e) => set("key", e.target.value)} placeholder="Cm" /></Field>
          </div>
          <div className="dz-form-columns">
            <Field label="ISRC"><Input value={form.isrc} onChange={(e) => set("isrc", e.target.value)} /></Field>
          </div>
          <Field label="Observações"><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} /></Field>
          <DialogFooter><Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>{!uploadError && <Button type="submit" disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{uploading ? "Enviando..." : loading ? "Salvando..." : "Adicionar faixa"}</Button>}</DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
