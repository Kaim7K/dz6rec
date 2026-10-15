import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FileField from "@/components/ui/file-field";
import { apiClient } from "@/api/appClient";
import { uploadFile, logActivity } from "@/lib/music";
import { Loader2 } from "lucide-react";

const Field = ({ label, children }) => <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;

export default function AddTrackDialog({ open, onClose, onCreated, project, trackCount }) {
  const [form, setForm] = useState({ name: "", main_artist_name: project?.main_artist_name || "", featuring: "", version_label: "Demo 01", track_number: trackCount + 1, bpm: "", key: "", isrc: "", notes: "" });
  const [audio, setAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setUploadProgress(0); setError("");
    try {
      const trackName = form.name.trim() || project.name || "Faixa sem nome";
      let audio_url = "";
      if (audio) {
        setUploading(true);
        audio_url = await uploadFile(audio, { onProgress: (value) => setUploadProgress(Math.max(0, Math.min(100, value || 0))) });
        setUploading(false);
      }
      const data = { ...form, name: trackName, project_id: project.id, audio_url, bpm: form.bpm ? Number(form.bpm) : undefined, track_number: Number(form.track_number) };
      const track = await apiClient.entities.Track.create(data);
      if (audio_url) await apiClient.entities.TrackVersion.create({ track_id: track.id, name: form.version_label, audio_url });
      const me = await apiClient.auth.me().catch(() => null);
      await logActivity(project.id, `Faixa adicionada: ${trackName}`, me?.full_name);
      await apiClient.entities.Project.update(project.id, { track_count: trackCount + 1 });
      setAudio(null); setUploadProgress(0);
      onCreated(); onClose();
    } catch (err) {
      setUploadProgress(0);
      setError(err.message?.includes("client token") || err.message?.includes("CORS") || err.message?.includes("Failed to fetch")
        ? "Nao foi possivel conectar ao Vercel Blob. Confira o token BLOB_READ_WRITE_TOKEN no projeto e tente novamente."
        : err.message || "Nao foi possivel enviar o arquivo");
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
        {error && <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nome"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={project?.name || "Ex. Noite Clara"} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Artista principal"><Input value={form.main_artist_name} onChange={(e) => set("main_artist_name", e.target.value)} /></Field>
            <Field label="Nº da faixa"><Input type="number" value={form.track_number} onChange={(e) => set("track_number", e.target.value)} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Participações"><Input value={form.featuring} onChange={(e) => set("featuring", e.target.value)} placeholder="Artistas convidados" /></Field>
            <Field label="Versão"><Input value={form.version_label} onChange={(e) => set("version_label", e.target.value)} placeholder="Demo 01, Mix 01..." /></Field>
          </div>
          <Field label="Arquivo de áudio">
            <FileField value={audio} onChange={(file) => { setAudio(file); setUploadProgress(0); setError(""); }} accept="audio/*" hint="MP3, WAV, FLAC..." />
            {(loading && audio) && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-2xs text-white/45">
                  <span>{uploading ? "Enviando arquivo" : "Finalizando"}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </Field>
          <p className="pt-1 text-2xs font-medium uppercase tracking-[0.16em] text-white/30">Detalhes opcionais</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="BPM"><Input type="number" value={form.bpm} onChange={(e) => set("bpm", e.target.value)} /></Field>
            <Field label="Tom"><Input value={form.key} onChange={(e) => set("key", e.target.value)} placeholder="Cm" /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ISRC"><Input value={form.isrc} onChange={(e) => set("isrc", e.target.value)} /></Field>
          </div>
          <Field label="Observações"><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} /></Field>
          <DialogFooter><Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="text-white/55">Cancelar</Button><Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{uploading ? "Enviando..." : loading ? "Salvando..." : "Adicionar faixa"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
