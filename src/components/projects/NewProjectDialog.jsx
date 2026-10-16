import { STATUS_COLORS, TYPE_COLORS } from "@/lib/choiceColors";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Field from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateField from "@/components/ui/date-field";
import FileField from "@/components/ui/file-field";
import { apiClient } from "@/api/appClient";
import { TYPE, STATUS, STATUS_ORDER, uploadFile, applyTemplate, logActivity } from "@/lib/music";
import { Loader2 } from "lucide-react";
import { validateSquareCover } from "@/lib/cover";
import { toast } from "@/components/ui/use-toast";

const SectionLabel = ({ children }) => <p className="pt-1 text-2xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{children}</p>;

export default function NewProjectDialog({ open, onClose, onCreated, artists, templates }) {
  const [form, setForm] = useState({ name: "", type: "single", main_artist_id: "", featuring: "", description: "", release_date: "", status: "rascunho" });
  const [cover, setCover] = useState(null);
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault(); if (loading) return; setLoading(true); setError("");
    try {
    let cover_url = ""; if (cover) { await validateSquareCover(cover); cover_url = await uploadFile(cover); }
    const artist = artists.find((a) => a.id === form.main_artist_id);
    const proj = await apiClient.entities.Project.create({ ...form, main_artist_name: artist?.name, cover_url });
    let templateFailed = false;
    if (templateId) { try { await applyTemplate(proj.id, templateId); } catch { templateFailed = true; } }
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(proj.id, "Projeto criado", me?.full_name);
    setLoading(false); setForm({ name: "", type: "single", main_artist_id: "", featuring: "", description: "", release_date: "", status: "rascunho" }); setCover(null); setTemplateId("");
    onCreated(); onClose();
    toast({ title: "Projeto criado", description: templateFailed ? "O projeto foi salvo, mas o checklist não foi aplicado por completo. Revise a aba Tarefas antes de adicionar novas etapas." : undefined });
    } catch (err) { setError(err.message || "Não foi possível criar o projeto. Seus dados foram mantidos para tentar novamente."); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={next => { if (!next && !loading) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
          <DialogDescription>Configure os detalhes essenciais do lançamento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && <p role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          <Field label="Nome do projeto"><Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex. Noite Clara" /></Field>
          <div className="dz-form-columns">
            <Field label="Tipo"><Select value={form.type} onValueChange={(v) => set("type", v)}><SelectTrigger accentColor={TYPE_COLORS[form.type]}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE).map(([k, v]) => <SelectItem key={k} value={k} accentColor={TYPE_COLORS[k]}>{v}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Status"><Select value={form.status} onValueChange={(v) => set("status", v)}><SelectTrigger accentColor={STATUS_COLORS[form.status]}><SelectValue /></SelectTrigger><SelectContent>{STATUS_ORDER.map((s) => <SelectItem key={s} value={s} accentColor={STATUS_COLORS[s]}>{STATUS[s]}</SelectItem>)}</SelectContent></Select></Field>
          </div>
          <Field label="Artista principal"><Select value={form.main_artist_id} onValueChange={(v) => set("main_artist_id", v)}><SelectTrigger><SelectValue placeholder="Selecionar artista" /></SelectTrigger><SelectContent>{artists.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></Field>
          <div className="dz-form-columns">
            <Field label="Participações"><Input value={form.featuring} onChange={(e) => set("featuring", e.target.value)} placeholder="Artistas convidados" /></Field>
            <Field label="Lançamento previsto"><DateField value={form.release_date} onChange={(v) => set("release_date", v)} placeholder="Selecionar data" /></Field>
          </div>
          <Field label="Capa"><FileField value={cover} onChange={setCover} accept="image/*" hint="PNG ou JPG quadrado (1:1)." /></Field>
          <Field label="Descrição (opcional)"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Breve contexto do projeto" /></Field>
          {templates.length > 0 && <Field label="Aplicar template"><Select value={templateId} onValueChange={setTemplateId}><SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger><SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></Field>}
          <DialogFooter><Button type="button" variant="ghost" disabled={loading} onClick={onClose} className="text-white/55">Cancelar</Button><Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar projeto</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
