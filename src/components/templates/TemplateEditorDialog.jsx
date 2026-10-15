import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import CargoBadge from "@/components/CargoBadge";
import TemplateItemEditor from "@/components/projects/TemplateItemEditor";

const NONE = "__none__";

export default function TemplateEditorDialog({ template, cargos, onClose, onSaved }) {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [newSection, setNewSection] = useState("");

  const load = async () => {
    const s = await apiClient.entities.ChecklistSection.filter({ template_id: template.id });
    const sorted = s.sort((a, b) => (a.order || 0) - (b.order || 0));
    setSections(sorted);
    const all = await apiClient.entities.ChecklistItem.list();
    const ids = new Set(sorted.map((x) => x.id));
    setItems(all.filter((i) => ids.has(i.section_id)));
  };
  useEffect(() => { load(); }, [template.id]);

  const sectionItems = (sid) => items.filter((i) => i.section_id === sid);

  const addSection = async (e) => { e.preventDefault(); if (!newSection.trim()) return; await apiClient.entities.ChecklistSection.create({ template_id: template.id, name: newSection, order: sections.length }); setNewSection(""); load(); };
  const renameSection = async (s, name) => { if (!name.trim()) return; await apiClient.entities.ChecklistSection.update(s.id, { name }); load(); };
  const setSectionCargo = async (s, cargo) => { await apiClient.entities.ChecklistSection.update(s.id, { cargo: cargo || null }); load(); };
  const delSection = async (s) => { await apiClient.entities.ChecklistItem.deleteMany({ section_id: s.id }); await apiClient.entities.ChecklistSection.delete(s.id); load(); };
  const addItem = async (sid, text) => { if (!text.trim()) return; await apiClient.entities.ChecklistItem.create({ section_id: sid, text, completed: false, detail_mode: "subtasks", observation: "", order: sectionItems(sid).filter((i) => !i.parent_id).length }); load(); };
  const addSub = async (parent, text) => { await apiClient.entities.ChecklistItem.create({ section_id: parent.section_id, text, completed: false, detail_mode: "subtasks", observation: "", parent_id: parent.id, order: 0 }); load(); };
  const setItemCargo = async (item, cargo) => { await apiClient.entities.ChecklistItem.update(item.id, { cargo: cargo || null }); load(); };
  const patchItem = async (item, patch) => { await apiClient.entities.ChecklistItem.update(item.id, patch); load(); };
  const delItem = async (item) => { if (items.some((i) => i.parent_id === item.id)) await apiClient.entities.ChecklistItem.deleteMany({ parent_id: item.id }); await apiClient.entities.ChecklistItem.delete(item.id); load(); };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Editar template</DialogTitle><DialogDescription>{template.name} · Alterações salvas automaticamente. Projetos existentes mantêm suas tarefas.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          {sections.map((s) => {
            const sItems = sectionItems(s.id);
            return (
              <div key={s.id} className="rounded-lg border border-white/[0.075] bg-white/[0.035] p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <input defaultValue={s.name} onBlur={(e) => { if (e.target.value !== s.name) renameSection(s, e.target.value); }} className="rounded-md border border-transparent bg-white/[0.045] px-2.5 py-1 text-sm font-medium outline-none transition-colors focus:border-primary/45" />
                  <CargoBadge cargo={s.cargo} cargos={cargos} />
                  <Select value={s.cargo || undefined} onValueChange={(v) => setSectionCargo(s, v === NONE ? null : v)}>
                    <SelectTrigger className="h-7 w-auto min-w-[5rem] border-white/[0.08] bg-white/[0.04] px-2 text-2xs text-muted-foreground"><SelectValue placeholder="cargo" /></SelectTrigger>
                    <SelectContent>
                      {s.cargo && <SelectItem value={NONE} className="text-muted-foreground">— Limpar —</SelectItem>}
                      {cargos.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button onClick={() => delSection(s)} className="ml-auto rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-red-400"><Trash2 size={15} /></button>
                </div>
                <div className="space-y-1">
                  {sItems.filter((i) => !i.parent_id).map((item) => (
                    <TemplateItemEditor key={item.id} item={item} allItems={sItems} depth={0} cargos={cargos} onAddSub={addSub} onSetCargo={setItemCargo} onPatch={patchItem} onDelete={delItem} />
                  ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); const f = e.target; addItem(s.id, f.text.value); f.reset(); }} className="mt-2 flex items-center gap-2">
                  <Plus size={14} className="text-muted-foreground" />
                  <input name="text" placeholder="Adicionar tarefa..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" />
                </form>
              </div>
            );
          })}
          <form onSubmit={addSection} className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input aria-label="Nome da nova seção" value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="Nova seção..." className="dz-input w-full px-3" />
            <button className="dz-primary-button h-10 px-4">Adicionar</button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
