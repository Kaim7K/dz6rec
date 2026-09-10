import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    const s = await base44.entities.ChecklistSection.filter({ template_id: template.id });
    const sorted = s.sort((a, b) => (a.order || 0) - (b.order || 0));
    setSections(sorted);
    const all = await base44.entities.ChecklistItem.list();
    const ids = new Set(sorted.map((x) => x.id));
    setItems(all.filter((i) => ids.has(i.section_id)));
  };
  useEffect(() => { load(); }, [template.id]);

  const sectionItems = (sid) => items.filter((i) => i.section_id === sid);

  const addSection = async (e) => { e.preventDefault(); if (!newSection.trim()) return; await base44.entities.ChecklistSection.create({ template_id: template.id, name: newSection, order: sections.length }); setNewSection(""); load(); };
  const renameSection = async (s, name) => { if (!name.trim()) return; await base44.entities.ChecklistSection.update(s.id, { name }); load(); };
  const setSectionCargo = async (s, cargo) => { await base44.entities.ChecklistSection.update(s.id, { cargo: cargo || null }); load(); };
  const delSection = async (s) => { await base44.entities.ChecklistItem.deleteMany({ section_id: s.id }); await base44.entities.ChecklistSection.delete(s.id); load(); };
  const addItem = async (sid, text) => { if (!text.trim()) return; await base44.entities.ChecklistItem.create({ section_id: sid, text, completed: false, order: sectionItems(sid).filter((i) => !i.parent_id).length }); load(); };
  const addSub = async (parent, text) => { await base44.entities.ChecklistItem.create({ section_id: parent.section_id, text, completed: false, parent_id: parent.id, order: 0 }); load(); };
  const setItemCargo = async (item, cargo) => { await base44.entities.ChecklistItem.update(item.id, { cargo: cargo || null }); load(); };
  const delItem = async (item) => { if (items.some((i) => i.parent_id === item.id)) await base44.entities.ChecklistItem.deleteMany({ parent_id: item.id }); await base44.entities.ChecklistItem.delete(item.id); load(); };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Editar template — {template.name}</DialogTitle></DialogHeader>
        <p className="text-sm text-white/40">Ajuste seções, tarefas e subtarefas. Projetos já criados não são alterados.</p>
        <div className="space-y-4">
          {sections.map((s) => {
            const sItems = sectionItems(s.id);
            return (
              <div key={s.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <input defaultValue={s.name} onBlur={(e) => { if (e.target.value !== s.name) renameSection(s, e.target.value); }} className="rounded-lg border border-transparent bg-white/[0.04] px-2.5 py-1 text-sm font-medium outline-none focus:border-white/15" />
                  <CargoBadge cargo={s.cargo} cargos={cargos} />
                  <Select value={s.cargo || undefined} onValueChange={(v) => setSectionCargo(s, v === NONE ? null : v)}>
                    <SelectTrigger className="h-7 w-auto min-w-[5rem] border-white/[0.08] bg-white/[0.04] px-2 text-2xs text-white/45"><SelectValue placeholder="cargo" /></SelectTrigger>
                    <SelectContent>
                      {s.cargo && <SelectItem value={NONE} className="text-white/45">— Limpar —</SelectItem>}
                      {cargos.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button onClick={() => delSection(s)} className="ml-auto rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-red-400"><Trash2 size={15} /></button>
                </div>
                <div className="space-y-1">
                  {sItems.filter((i) => !i.parent_id).map((item) => (
                    <TemplateItemEditor key={item.id} item={item} allItems={sItems} depth={0} cargos={cargos} onAddSub={addSub} onSetCargo={setItemCargo} onDelete={delItem} />
                  ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); const f = e.target; addItem(s.id, f.text.value); f.reset(); }} className="mt-2 flex items-center gap-2">
                  <Plus size={14} className="text-white/30" />
                  <input name="text" placeholder="Adicionar tarefa..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" />
                </form>
              </div>
            );
          })}
          <form onSubmit={addSection} className="flex items-center gap-2">
            <input value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="Nova seção..." className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition placeholder:text-white/30 focus:border-white/15" />
            <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Adicionar</button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}