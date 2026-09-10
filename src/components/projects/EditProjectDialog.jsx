import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateField from "@/components/ui/date-field";
import FileField from "@/components/ui/file-field";
import { apiClient } from "@/api/appClient";
import { TYPE, STATUS, STATUS_ORDER, uploadFile, logActivity } from "@/lib/music";
import { Loader2, X } from "lucide-react";

const Field = ({ label, children }) => <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;

export default function EditProjectDialog({ project, open, onClose, onSaved, artists = [] }) {
  const [form, setForm] = useState({ name: "", type: "single", status: "rascunho", main_artist_id: "", featuring: "", description: "", release_date: "" });
  const [cover, setCover] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || "",
        type: project.type || "single",
        status: project.status || "rascunho",
        main_artist_id: project.main_artist_id || "",
        featuring: project.featuring || "",
        description: project.description || "",
        release_date: project.release_date ? String(project.release_date).slice(0, 10) : "",
      });
    }
    setCover(null);
    setRemoveCover(false);
  }, [project, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const artist = artists.find((a) => a.id === form.main_artist_id);
    const data = { ...form, main_artist_name: artist ? artist.name : form.main_artist_id ? "" : project.main_artist_name };
    if (cover) data.cover_url = await uploadFile(cover);
    else if (removeCover) data.cover_url = "";
    await apiClient.entities.Project.update(project.id, data);
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(project.id, "Projeto atualizado", me?.full_name);
    setLoading(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar projeto</DialogTitle>
          <DialogDescription>Ajuste os detalhes do lanÃ§amento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nome do projeto"><Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex. Noite Clara" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo"><Select value={form.type} onValueChange={(v) => set("type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Status"><Select value={form.status} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS[s]}</SelectItem>)}</SelectContent></Select></Field>
          </div>
          <Field label="Artista principal"><Select value={form.main_artist_id} onValueChange={(v) => set("main_artist_id", v)}><SelectTrigger><SelectValue placeholder="Selecionar artista" /></SelectTrigger><SelectContent>{artists.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ParticipaÃ§Ãµes"><Input value={form.featuring} onChange={(e) => set("featuring", e.target.value)} placeholder="Artistas convidados" /></Field>
            <Field label="LanÃ§amento previsto"><DateField value={form.release_date} onChange={(v) => set("release_date", v)} /></Field>
          </div>
          <Field label="Capa">
            {project?.cover_url && !removeCover ? (
              <div className="mb-2 flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
                <img src={project.cover_url} alt="" className="h-10 w-10 rounded-md object-cover" />
                <p className="flex-1 text-sm text-white/60">Capa atual</p>
                <button type="button" onClick={() => setRemoveCover(true)} aria-label="Remover capa" className="rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white"><X size={14} /></button>
              </div>
            ) : null}
            <FileField value={cover} onChange={setCover} accept="image/*" hint="PNG ou JPG, preferencialmente 1:1" />
          </Field>
          <Field label="DescriÃ§Ã£o (opcional)"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Breve contexto do projeto" /></Field>
          <DialogFooter><Button type="button" variant="ghost" onClick={onClose} className="text-white/55">Cancelar</Button><Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar alteraÃ§Ãµes</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}