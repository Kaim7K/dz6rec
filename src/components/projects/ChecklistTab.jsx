import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import { Plus, StickyNote } from "lucide-react";
import CargoBadge from "@/components/CargoBadge";
import ChecklistItemRow from "@/components/projects/ChecklistItemRow";
import NotesDialog from "@/components/projects/NotesDialog";
import { cargoList, logActivity, usersForCargo } from "@/lib/music";
import { notifyNextStage, notifyUsers } from "@/lib/notifications";

export default function ChecklistTab({ project }) {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [noteSection, setNoteSection] = useState(null);
  const [newSection, setNewSection] = useState("");
  const [users, setUsers] = useState([]);
  const [cargos, setCargos] = useState([]);
  const load = () => { apiClient.entities.ChecklistSection.filter({ project_id: project.id }).then((s) => setSections(s.sort((a, b) => a.order - b.order))); apiClient.entities.ChecklistItem.filter({ project_id: project.id }).then(setItems); };
  useEffect(load, [project.id]);
  useEffect(() => { Promise.all([apiClient.entities.User.list().catch(() => []), apiClient.entities.Cargo.list().catch(() => [])]).then(([us, cs]) => { setUsers(us); setCargos([...new Set([...cs.map((c) => c.name), ...us.flatMap((u) => cargoList(u.cargo))])].map((name) => ({ name }))); }); }, []);
  const addSection = async (e) => { e.preventDefault(); if (!newSection.trim()) return; await apiClient.entities.ChecklistSection.create({ project_id: project.id, name: newSection, order: sections.length }); const me = await apiClient.auth.me().catch(() => null); await logActivity(project.id, `SeÃ§Ã£o adicionada: ${newSection}`, me?.full_name); setNewSection(""); load(); };
  const addItem = async (sectionId, text) => { if (!text.trim()) return; await apiClient.entities.ChecklistItem.create({ section_id: sectionId, project_id: project.id, text, completed: false, order: items.filter((i) => i.section_id === sectionId && !i.parent_id).length }); load(); };
  const toggle = async (item) => {
    const newCompleted = !item.completed;
    await apiClient.entities.ChecklistItem.update(item.id, { completed: newCompleted });
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(project.id, `${newCompleted ? "ConcluÃ­da" : "Reaberta"}: ${item.text}`, me?.full_name);
    if (newCompleted) await notifyNextStage({ project, sectionId: item.section_id, toggledItemId: item.id, items, sections, users, excludeUserId: me?.id });
    load();
  };
  const addSub = async (parent, text) => { await apiClient.entities.ChecklistItem.create({ section_id: parent.section_id, project_id: project.id, text, completed: false, parent_id: parent.id, order: 0 }); load(); };
  const assign = async (item, user) => {
    await apiClient.entities.ChecklistItem.update(item.id, { responsible_id: user?.id || null, responsible_name: user?.full_name || user?.email || null });
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(project.id, `ResponsÃ¡vel definido em "${item.text}": ${user?.full_name || "removido"}`, me?.full_name);
    if (user && user.id !== me?.id) await notifyUsers([user.id], { text: `VocÃª foi atribuÃ­do Ã  tarefa "${item.text}" em "${project.name}"`, projectId: project.id, link: `/projetos/${project.id}` });
    load();
  };
  const assignCargo = async (item, cargoName) => {
    await apiClient.entities.ChecklistItem.update(item.id, { cargo: cargoName || null });
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(project.id, cargoName ? `Cargo "${cargoName}" atribuÃ­do Ã  tarefa "${item.text}"` : `Cargo removido da tarefa "${item.text}"`, me?.full_name);
    if (cargoName) await notifyUsers(usersForCargo(users, cargoName).map((u) => u.id), { text: `VocÃª foi atribuÃ­do Ã  tarefa "${item.text}" (${cargoName}) em "${project.name}"`, projectId: project.id, link: `/projetos/${project.id}` }, me?.id);
    load();
  };
  return (
    <div className="space-y-3">
      {sections.map((s) => { const sItems = items.filter((i) => i.section_id === s.id); const done = sItems.filter((i) => i.completed && !i.parent_id).length; const total = sItems.filter((i) => !i.parent_id).length; return (
        <div key={s.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <h3 className="font-display text-base font-medium text-white">{s.name}</h3>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-2xs text-white/45">{done}/{total}</span>
            {s.cargo && <CargoBadge cargo={s.cargo} cargos={cargos} />}
            <button onClick={() => setNoteSection(s)} className="ml-auto rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"><StickyNote size={15} /></button>
          </div>
          <div className="space-y-0.5">{sItems.filter((i) => !i.parent_id).map((item) => <ChecklistItemRow key={item.id} item={item} allItems={sItems} depth={0} users={users} cargos={cargos} onToggle={toggle} onAddSub={addSub} onAssign={assign} onAssignCargo={assignCargo} />)}</div>
          <form onSubmit={(e) => { e.preventDefault(); const f = e.target; addItem(s.id, f.text.value); f.reset(); }} className="mt-2 flex items-center gap-2"><Plus size={15} className="text-white/30" /><input name="text" placeholder="Adicionar tarefa..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" /></form>
        </div>
      ); })}
      <form onSubmit={addSection} className="flex items-center gap-2"><input value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="Nova seÃ§Ã£o..." className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition placeholder:text-white/30 focus:border-white/15" /><button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Adicionar</button></form>
      {noteSection && <NotesDialog section={noteSection} onClose={() => setNoteSection(null)} />}
    </div>
  );
}