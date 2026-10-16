import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Field from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/api/appClient";
import { uploadFile, applyTemplate, logActivity } from "@/lib/music";
import { Loader2 } from "lucide-react";
import ProjectFormFields from "./ProjectFormFields";
import { validateSquareCover } from "@/lib/cover";
import { toast } from "@/components/ui/use-toast";


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
      <DialogContent className="dz-project-dialog max-w-3xl">
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
          <DialogDescription>Configure os detalhes essenciais do lançamento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && <p role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          <ProjectFormFields form={form} set={set} artists={artists} cover={cover} setCover={setCover} loading={loading}>
            {templates.length > 0 && <Field label="Aplicar template"><Select value={templateId} onValueChange={setTemplateId}><SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger><SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></Field>}
          </ProjectFormFields>
          <DialogFooter><Button type="button" variant="ghost" disabled={loading} onClick={onClose} className="text-white/55">Cancelar</Button><Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar projeto</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
