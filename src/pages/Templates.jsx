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
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-2xs font-medium uppercase tracking-[0.18em] text-white/35">Estrutura</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">Templates</h1>
          <p className="mt-1.5 text-white/45">Estruturas de checklist reutilizáveis ao criar projetos.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"><Plus size={16} />Novo template</button>
      </div>
      {templates.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-12 text-center text-sm text-white/35">Nenhum template ainda.</div>
      ) : (
        <div className="space-y-2.5">{templates.map((t) => (
          <div key={t.id} className="group flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-colors hover:border-white/[0.1]">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-white/40"><LayoutTemplate size={18} /></div>
              <div><p className="font-medium text-white">{t.name}</p><p className="text-2xs text-white/40">Aplicável ao criar um projeto · editável</p></div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditing(t)} className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"><Pencil size={15} /></button>
              <button onClick={() => remove(t)} className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/5 hover:text-red-400"><Trash2 size={15} /></button>
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