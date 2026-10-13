import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LayoutTemplate, Pencil, Plus, Trash2 } from "lucide-react";
import TemplateEditorDialog from "@/components/templates/TemplateEditorDialog";

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const load = () => { apiClient.entities.ChecklistTemplate.list().then(setTemplates); apiClient.entities.Cargo.list().then(setCargos).catch(() => {}); };
  useEffect(() => { load(); }, []);
  const create = async (e) => { e.preventDefault(); if (!name.trim()) return; await apiClient.entities.ChecklistTemplate.create({ name, project_type: "custom" }); setName(""); setOpen(false); load(); };
  const remove = async (t) => {
    const secs = await apiClient.entities.ChecklistSection.filter({ template_id: t.id });
    for (const s of secs) await apiClient.entities.ChecklistItem.deleteMany({ section_id: s.id }).catch(() => {});
    await apiClient.entities.ChecklistSection.deleteMany({ template_id: t.id });
    await apiClient.entities.ChecklistTemplate.delete(t.id);
    load();
  };
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
          <div key={t.id} className="dz-list-row group flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/12 text-primary ring-1 ring-primary/18"><LayoutTemplate size={18} /></div>
              <div><p className="font-medium text-white">{t.name}</p><p className="text-2xs text-white/40">Aplicável ao criar um projeto · editável</p></div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditing(t)} className="dz-icon-button h-8 w-8"><Pencil size={15} /></button>
              <button onClick={() => remove(t)} className="dz-icon-button h-8 w-8 hover:text-red-400"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}</div>
      )}
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Novo template</DialogTitle></DialogHeader>
        <form onSubmit={create}><div className="space-y-1.5"><Label>Nome</Label><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Lançamento de Single" /></div><DialogFooter className="mt-5"><Button type="submit" className="bg-primary text-primary-foreground">Criar</Button></DialogFooter></form>
      </DialogContent></Dialog>
      {editing && <TemplateEditorDialog template={editing} cargos={cargos} onClose={() => setEditing(null)} />}
    </div>
  );
}
