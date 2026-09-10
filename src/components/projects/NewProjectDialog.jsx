import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateField from "@/components/ui/date-field";
import FileField from "@/components/ui/file-field";
import { base44 } from "@/api/base44Client";
import { TYPE, STATUS, STATUS_ORDER, uploadFile, applyTemplate, logActivity } from "@/lib/music";
import { Loader2 } from "lucide-react";

const Field = ({ label, children }) => <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
const SectionLabel = ({ children }) => <p className="pt-1 text-2xs font-medium uppercase tracking-[0.16em] text-white/30">{children}</p>;

export default function NewProjectDialog({ open, onClose, onCreated, artists, templates }) {
  const [form, setForm] = useState({ name: "", type: "single", main_artist_id: "", featuring: "", description: "", release_date: "", status: "rascunho" });
  const [cover, setCover] = useState(null);
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    let cover_url = ""; if (cover) cover_url = await uploadFile(cover);
    const artist = artists.find((a) => a.id === form.main_artist_id);
    const proj = await base44.entities.Project.create({ ...form, main_artist_name: artist?.name, cover_url });
    if (templateId) await applyTemplate(proj.id, templateId);
    const me = await base44.auth.me().catch(() => null);
    await logActivity(proj.id, "Projeto criado", me?.full_name);
    setLoading(false); setForm({ name: "", type: "single", main_artist_id: "", featuring: "", description: "", release_date: "", status: "rascunho" }); setCover(null); setTemplateId("");
    onCreated(); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
          <DialogDescription>Configure os detalhes essenciais do lançamento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nome do projeto"><Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex. Noite Clara" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo"><Select value={form.type} onValueChange={(v) => set("type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Status"><Select value={form.status} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS[s]}</SelectItem>)}</SelectContent></Select></Field>
          </div>
          <Field label="Artista principal"><Select value={form.main_artist_id} onValueChange={(v) => set("main_artist_id", v)}><SelectTrigger><SelectValue placeholder="Selecionar artista" /></SelectTrigger><SelectContent>{artists.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Participações"><Input value={form.featuring} onChange={(e) => set("featuring", e.target.value)} placeholder="Artistas convidados" /></Field>
            <Field label="Lançamento previsto"><DateField value={form.release_date} onChange={(v) => set("release_date", v)} placeholder="Selecionar data" /></Field>
          </div>
          <Field label="Capa"><FileField value={cover} onChange={setCover} accept="image/*" hint="PNG ou JPG, preferencialmente 1:1" /></Field>
          <Field label="Descrição (opcional)"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Breve contexto do projeto" /></Field>
          {templates.length > 0 && <Field label="Aplicar template"><Select value={templateId} onValueChange={setTemplateId}><SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger><SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></Field>}
          <DialogFooter><Button type="button" variant="ghost" onClick={onClose} className="text-white/55">Cancelar</Button><Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar projeto</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}