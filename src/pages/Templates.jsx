import PageSkeleton from "@/components/PageSkeleton";
import FormField from "@/components/ui/form-field";
import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutTemplate, Pencil, Plus, Trash2 } from "lucide-react";
import TemplateEditorDialog from "@/components/templates/TemplateEditorDialog";

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const load = () => { apiClient.entities.ChecklistTemplate.list().then(setTemplates).finally(() => setLoaded(true)); apiClient.entities.Cargo.list().then(setCargos).catch(() => {}); };
  useEffect(() => { load(); }, []);
  const create = async (e) => {
    e.preventDefault(); if (!name.trim() || saving) return;
    setSaving(true); setError("");
    try {
      await apiClient.entities.ChecklistTemplate.create({ name, project_type: "custom" });
      setName(""); setOpen(false); load();
    } catch (err) { setError(err.message || "Não foi possível criar o template."); }
    finally { setSaving(false); }
  };
  const remove = async (t) => {
    const secs = await apiClient.entities.ChecklistSection.filter({ template_id: t.id });
    for (const s of secs) await apiClient.entities.ChecklistItem.deleteMany({ section_id: s.id }).catch(() => {});
    await apiClient.entities.ChecklistSection.deleteMany({ template_id: t.id });
    await apiClient.entities.ChecklistTemplate.delete(t.id);
    load();
  };
  if (!loaded) return <PageSkeleton />;
  return (
    <div className="dz-page">
      <div className="dz-page-head">
        <div>
          <p className="dz-kicker">Estrutura</p>
          <h1 className="dz-page-title">Templates</h1>
          <p className="dz-page-subtitle">Checklists reutilizáveis para manter lançamentos no mesmo padrão.</p>
        </div>
        <button onClick={() => setOpen(true)} className="dz-primary-button"><Plus size={16} />Novo template</button>
      </div>
      {templates.length === 0 ? (
        <div className="dz-empty">Nenhum template ainda.</div>
      ) : (
        <div className="dz-card overflow-hidden">{templates.map((t) => (
          <div key={t.id} className="dz-list-row group flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/12 text-primary ring-1 ring-primary/18"><LayoutTemplate size={18} /></div>
              <div className="min-w-0"><p className="break-words font-medium text-white">{t.name}</p><p className="text-2xs text-muted-foreground">Aplicável ao criar um projeto · editável</p></div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button onClick={() => setEditing(t)} aria-label={`Editar template ${t.name}`} className="dz-icon-button"><Pencil size={15} /></button>
              <button onClick={() => remove(t)} aria-label={`Excluir template ${t.name}`} className="dz-icon-button hover:text-red-300"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}</div>
      )}
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Novo template</DialogTitle><DialogDescription>Crie uma estrutura reutilizável para seus lançamentos.</DialogDescription></DialogHeader>
        {error && <p role="alert" className="dz-form-error">{error}</p>}
        <form onSubmit={create}><FormField label="Nome"><Input required disabled={saving} value={name} onChange={(e) => setName(e.target.value)} placeholder="Lançamento de Single" /></FormField><DialogFooter className="mt-5"><Button type="submit" disabled={saving} className="bg-primary text-primary-foreground">{saving ? "Criando..." : "Criar"}</Button></DialogFooter></form>
      </DialogContent></Dialog>
      {editing && <TemplateEditorDialog template={editing} cargos={cargos} onClose={() => setEditing(null)} />}
    </div>
  );
}
