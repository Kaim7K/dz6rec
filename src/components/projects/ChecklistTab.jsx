import React, { useEffect, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { apiClient } from "@/api/appClient";
import CargoBadge from "@/components/CargoBadge";
import ChecklistItemRow from "@/components/projects/ChecklistItemRow";
import NotesDialog from "@/components/projects/NotesDialog";
import { CATEGORIES, cargoList, logActivity, usersForCargo } from "@/lib/music";
import { notifyNextStage, notifyUsers } from "@/lib/notifications";

export default function ChecklistTab({ project }) {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [noteSection, setNoteSection] = useState(null);
  const [newSection, setNewSection] = useState("");
  const [users, setUsers] = useState([]);
  const [cargos, setCargos] = useState([]);

  const load = () => {
    apiClient.entities.ChecklistSection.filter({ project_id: project.id }).then((s) => setSections(s.sort((a, b) => a.order - b.order)));
    apiClient.entities.ChecklistItem.filter({ project_id: project.id }).then(setItems);
  };

  useEffect(load, [project.id]);
  useEffect(() => {
    Promise.all([apiClient.entities.User.list().catch(() => []), apiClient.entities.Cargo.list().catch(() => [])]).then(([us, cs]) => {
      setUsers(us);
      setCargos([...new Set([...cs.map((c) => c.name), ...us.flatMap((u) => cargoList(u.cargo))])].map((name) => ({ name })));
    });
  }, []);

  const sectionCategory = (section) => {
    if (section.category) return section.category;
    const text = `${section.name || ""} ${section.cargo || ""}`.toLowerCase();
    if (text.includes("visual") || text.includes("design") || text.includes("capa")) return "visual";
    if (text.includes("marketing") || text.includes("social") || text.includes("lançamento")) return "marketing";
    return "musica";
  };

  const addSection = async (e) => {
    e.preventDefault();
    if (!newSection.trim()) return;
    await apiClient.entities.ChecklistSection.create({ project_id: project.id, name: newSection.trim(), order: sections.length });
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(project.id, `Seção adicionada: ${newSection.trim()}`, me?.full_name);
    setNewSection("");
    load();
  };

  const addItems = async (sectionId, text) => {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return;
    const orderStart = items.filter((i) => i.section_id === sectionId && !i.parent_id).length;
    await apiClient.entities.ChecklistItem.bulkCreate(lines.map((line, index) => ({
      section_id: sectionId,
      project_id: project.id,
      text: line,
      completed: false,
      priority: "normal",
      order: orderStart + index,
    })));
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(project.id, `${lines.length} tarefa${lines.length > 1 ? "s" : ""} adicionada${lines.length > 1 ? "s" : ""}`, me?.full_name);
    load();
  };

  const addCategoryItems = async (category, text) => {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return;
    let section = sections.find((s) => sectionCategory(s) === category.key);
    if (!section) {
      section = await apiClient.entities.ChecklistSection.create({ project_id: project.id, name: category.label, category: category.key, order: sections.length });
    }
    await addItems(section.id, lines.join("\n"));
  };

  const toggle = async (item) => {
    const newCompleted = !item.completed;
    await apiClient.entities.ChecklistItem.update(item.id, { completed: newCompleted });
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(project.id, `${newCompleted ? "Concluída" : "Reaberta"}: ${item.text}`, me?.full_name);
    if (newCompleted) await notifyNextStage({ project, sectionId: item.section_id, toggledItemId: item.id, items, sections, users, excludeUserId: me?.id });
    load();
  };

  const addSub = async (parent, text) => {
    if (!text.trim()) return;
    await apiClient.entities.ChecklistItem.create({ section_id: parent.section_id, project_id: project.id, text: text.trim(), completed: false, priority: "normal", parent_id: parent.id, order: 0 });
    load();
  };

  const deleteItem = async (item) => {
    await apiClient.entities.ChecklistItem.deleteMany({ parent_id: item.id });
    await apiClient.entities.ChecklistItem.delete(item.id);
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(project.id, `Tarefa excluida: ${item.text}`, me?.full_name);
    load();
  };

  const patchItem = async (item, patch) => {
    await apiClient.entities.ChecklistItem.update(item.id, patch);
    const me = await apiClient.auth.me().catch(() => null);
    const changed = patch.priority ? `Prioridade definida em "${item.text}"` : `Prazo definido em "${item.text}"`;
    await logActivity(project.id, changed, me?.full_name);
    load();
  };

  const assign = async (item, user) => {
    await apiClient.entities.ChecklistItem.update(item.id, { responsible_id: user?.id || null, responsible_name: user?.full_name || user?.email || null });
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(project.id, `Responsável definido em "${item.text}": ${user?.full_name || "removido"}`, me?.full_name);
    if (user && user.id !== me?.id) await notifyUsers([user.id], { text: `Você foi atribuído à tarefa "${item.text}" em "${project.name}"`, projectId: project.id, link: `/projetos/${project.id}` });
    load();
  };

  const assignCargo = async (item, cargoName) => {
    await apiClient.entities.ChecklistItem.update(item.id, { cargo: cargoName || null });
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(project.id, cargoName ? `Cargo "${cargoName}" atribuído à tarefa "${item.text}"` : `Cargo removido da tarefa "${item.text}"`, me?.full_name);
    if (cargoName) await notifyUsers(usersForCargo(users, cargoName).map((u) => u.id), { text: `Você foi atribuído à tarefa "${item.text}" (${cargoName}) em "${project.name}"`, projectId: project.id, link: `/projetos/${project.id}` }, me?.id);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 2xl:grid-cols-3">
        {CATEGORIES.map((category) => {
          const categorySections = sections.filter((section) => sectionCategory(section) === category.key);
          const categoryItems = categorySections.flatMap((section) => items.filter((item) => item.section_id === section.id && !item.parent_id));
          const done = categoryItems.filter((item) => item.completed).length;
          const firstSection = categorySections[0];

          return (
            <section key={category.key} className="min-h-[22rem] min-w-0 rounded-md border border-white/[0.065] bg-white/[0.018] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-4">
              <div className="mb-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold leading-none text-white">{category.label}</p>
                  <p className="mt-2 text-xs text-white/50">{done}/{categoryItems.length} concluídas</p>
                </div>
                <div className="flex min-w-0 max-w-[11rem] flex-wrap items-center justify-end gap-2 sm:max-w-[14rem] 2xl:max-w-[10.5rem]">
                  {firstSection?.cargo && <CargoBadge cargo={firstSection.cargo} cargos={cargos} className="h-8 max-w-full px-3 text-xs" />}
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                  <button onClick={() => firstSection && setNoteSection(firstSection)} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white" aria-label="Notas da seção"><MoreHorizontal size={17} /></button>
                </div>
              </div>

              <div className="space-y-1.5">
                {categorySections.flatMap((section) => {
                  const sectionItems = items.filter((item) => item.section_id === section.id);
                  return sectionItems.filter((item) => !item.parent_id).map((item) => (
                    <ChecklistItemRow key={item.id} item={item} allItems={sectionItems} depth={0} users={users} cargos={cargos} onToggle={toggle} onAddSub={addSub} onAssign={assign} onAssignCargo={assignCargo} onPatch={patchItem} onDelete={deleteItem} />
                  ));
                })}

                {categorySections.length === 0 && (
                  <p className="rounded-md border border-dashed border-white/[0.08] px-3 py-3 text-sm text-white/35">Nenhuma seção nesta operação.</p>
                )}

                <form onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; addCategoryItems(category, f.text.value); f.reset(); }} className="flex min-h-20 items-start gap-3 rounded-md border border-dashed border-white/[0.13] px-3.5 py-3">
                  <Plus size={18} className="mt-1 text-white/55" />
                  <textarea name="text" rows={2} placeholder={"Adicionar tarefas...\nUma tarefa por linha"} className="min-w-0 flex-1 resize-none bg-transparent text-sm leading-5 outline-none placeholder:text-white/38" />
                </form>
              </div>
            </section>
          );
        })}
      </div>

      <form onSubmit={addSection} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:gap-4">
        <div className="flex h-14 items-center gap-4 rounded-md border border-white/[0.075] bg-white/[0.018] px-5">
          <Plus size={22} className="text-white/70" />
          <input value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="Nova seção..." className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-white/42" />
        </div>
        <button className="h-12 rounded-md bg-primary px-7 text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90 sm:h-14">Adicionar</button>
      </form>

      {noteSection && <NotesDialog section={noteSection} onClose={() => setNoteSection(null)} />}
    </div>
  );
}
