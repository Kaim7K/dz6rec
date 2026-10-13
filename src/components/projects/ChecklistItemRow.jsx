import React, { useState } from "react";
import { CalendarDays, ChevronDown, Circle, GripVertical, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import AssignResponsible from "@/components/projects/AssignResponsible";
import { dueLabel, isDueSoon, isOverdue, PRIORITY, PRIORITY_ORDER } from "@/lib/music";

export default function ChecklistItemRow({ item, allItems, depth, users, cargos, onToggle, onAddSub, onAssign, onAssignCargo, onPatch, onDelete }) {
  const children = allItems.filter((i) => i.parent_id === item.id);
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const priority = PRIORITY[item.priority || "normal"] || PRIORITY.normal;
  const overdue = isOverdue(item.due_date, item.completed);
  const soon = isDueSoon(item.due_date, item.completed);

  if (depth > 0) {
    return (
      <div className="group ml-8 flex items-center gap-2 py-0.5 text-xs">
        <Checkbox checked={item.completed} onCheckedChange={() => onToggle(item)} className="h-4 w-4 rounded-full border-white/45 data-[state=checked]:border-primary data-[state=checked]:bg-primary" />
        <span className={`min-w-0 flex-1 ${item.completed ? "line-through text-white/35" : "text-white/52"}`}>{item.text}</span>
        <button type="button" onClick={() => onDelete(item)} aria-label={`Excluir ${item.text}`} className="rounded p-1 text-white/20 opacity-0 transition-colors hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100">
          <Trash2 size={12} />
        </button>
      </div>
    );
  }

  return (
    <article className="overflow-hidden rounded-md border border-white/[0.055] bg-white/[0.022] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="p-2.5">
        <div className="flex items-center gap-2">
          <GripVertical size={15} className="shrink-0 text-white/30" />
          <Checkbox checked={item.completed} onCheckedChange={() => onToggle(item)} className="h-4 w-4 rounded-[4px] border-white/60 data-[state=checked]:border-primary data-[state=checked]:bg-primary" />
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium leading-5 ${item.completed ? "line-through text-white/38" : "text-white/88"}`}>{item.text}</p>
          </div>

          <button type="button" onClick={() => onDelete(item)} className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/[0.02] text-white/26 transition-colors hover:bg-red-500/10 hover:text-red-300" aria-label={`Excluir ${item.text}`}>
            <Trash2 size={13} />
          </button>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/[0.03] text-white/42 transition-colors hover:bg-white/[0.055] hover:text-white" aria-label={expanded ? "Recolher tarefa" : "Expandir tarefa"}>
            <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        {expanded && (
          <div className="mt-2 border-t border-white/[0.05] pt-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <button
                onClick={() => setAdding(true)}
                className="text-2xs text-white/30 transition-colors hover:text-white/58"
              >
                + Subtarefa
              </button>
              <label className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-white/[0.035] px-2 text-2xs ${priority.tone}`}>
                <select value={item.priority || "normal"} onChange={(e) => onPatch(item, { priority: e.target.value })} className="bg-transparent outline-none">
                  {PRIORITY_ORDER.map((key) => <option key={key} value={key}>{PRIORITY[key].label}</option>)}
                </select>
                <ChevronDown size={13} />
              </label>
            </div>

            <div className="space-y-0.5">
              {children.map((child) => (
                <ChecklistItemRow key={child.id} item={child} allItems={allItems} depth={depth + 1} users={users} cargos={cargos} onToggle={onToggle} onAddSub={onAddSub} onAssign={onAssign} onAssignCargo={onAssignCargo} onPatch={onPatch} onDelete={onDelete} />
              ))}
              {adding && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!text.trim()) return;
                    onAddSub(item, text);
                    setText("");
                    setAdding(false);
                  }}
                  className="ml-8 flex items-center gap-2 py-0.5"
                >
                  <Circle size={13} className="text-white/35" />
                  <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Subtarefa..." className="min-w-0 flex-1 bg-transparent text-xs text-white/70 outline-none placeholder:text-white/25" autoFocus />
                </form>
              )}
            </div>

            <div className="mt-2 grid gap-1.5 border-t border-white/[0.05] pt-2 sm:grid-cols-[1fr_1.25fr] sm:gap-0">
              <label className={`flex h-8 items-center gap-2 text-2xs ${overdue ? "text-primary" : soon ? "text-amber-300" : "text-white/58"}`}>
                <CalendarDays size={15} className="text-white/50" />
                <span>{item.due_date ? dueLabel(item.due_date) : "Sem prazo"}</span>
                <input type="date" value={item.due_date || ""} onChange={(e) => onPatch(item, { due_date: e.target.value || null })} className="w-5 bg-transparent text-transparent outline-none [color-scheme:dark]" aria-label={`Prazo de ${item.text}`} />
              </label>
              <div className="flex h-8 items-center sm:border-l sm:border-white/[0.055] sm:pl-3">
                <AssignResponsible item={item} users={users} cargos={cargos} onAssign={onAssign} onAssignCargo={onAssignCargo} className="h-7 border-0 bg-transparent px-0 text-2xs text-white/72" />
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
