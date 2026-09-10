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
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    let audio_url = ""; if (audio) audio_url = await uploadFile(audio);
    const data = { ...form, project_id: project.id, audio_url, bpm: form.bpm ? Number(form.bpm) : undefined, track_number: Number(form.track_number) };
    const track = await apiClient.entities.Track.create(data);
    if (audio_url) await apiClient.entities.TrackVersion.create({ track_id: track.id, name: form.version_label, audio_url });
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(project.id, `Faixa adicionada: ${form.name}`, me?.full_name);
    await apiClient.entities.Project.update(project.id, { track_count: trackCount + 1 });
    setLoading(false); setAudio(null);
    onCreated(); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar faixa</DialogTitle>
          <DialogDescription>Informe o essencial. Detalhes tÃ©cnicos podem ser preenchidos depois.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nome"><Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex. Noite Clara" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Artista principal"><Input value={form.main_artist_name} onChange={(e) => set("main_artist_name", e.target.value)} /></Field>
            <Field label="NÂº da faixa"><Input type="number" value={form.track_number} onChange={(e) => set("track_number", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ParticipaÃ§Ãµes"><Input value={form.featuring} onChange={(e) => set("featuring", e.target.value)} placeholder="Artistas convidados" /></Field>
            <Field label="VersÃ£o"><Input value={form.version_label} onChange={(e) => set("version_label", e.target.value)} placeholder="Demo 01, Mix 01..." /></Field>
          </div>
          <Field label="Arquivo de Ã¡udio"><FileField value={audio} onChange={setAudio} accept="audio/*" hint="MP3, WAV, FLAC..." /></Field>
          <p className="pt-1 text-2xs font-medium uppercase tracking-[0.16em] text-white/30">Detalhes opcionais</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="BPM"><Input type="number" value={form.bpm} onChange={(e) => set("bpm", e.target.value)} /></Field>
            <Field label="Tom"><Input value={form.key} onChange={(e) => set("key", e.target.value)} placeholder="Cm" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ISRC"><Input value={form.isrc} onChange={(e) => set("isrc", e.target.value)} /></Field>
          </div>
          <Field label="ObservaÃ§Ãµes"><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} /></Field>
          <DialogFooter><Button type="button" variant="ghost" onClick={onClose} className="text-white/55">Cancelar</Button><Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Adicionar faixa</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}