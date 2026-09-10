import React, { useState } from "react";
import { CalendarDays, ChevronDown, Circle, GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import AssignResponsible from "@/components/projects/AssignResponsible";
import { dueLabel, isDueSoon, isOverdue, PRIORITY, PRIORITY_ORDER } from "@/lib/music";

export default function ChecklistItemRow({ item, allItems, depth, users, cargos, onToggle, onAddSub, onAssign, onAssignCargo, onPatch }) {
  const children = allItems.filter((i) => i.parent_id === item.id);
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const priority = PRIORITY[item.priority || "normal"] || PRIORITY.normal;
  const overdue = isOverdue(item.due_date, item.completed);
  const soon = isDueSoon(item.due_date, item.completed);

  if (depth > 0) {
    return (
      <div className="ml-12 flex items-center gap-2 py-1 text-sm">
        <Checkbox checked={item.completed} onCheckedChange={() => onToggle(item)} className="h-4 w-4 rounded-full border-white/45 data-[state=checked]:border-primary data-[state=checked]:bg-primary" />
        <span className={item.completed ? "line-through text-white/35" : "text-white/52"}>{item.text}</span>
      </div>
    );
  }

  return (
    <article className="overflow-hidden rounded-md border border-white/[0.065] bg-white/[0.026] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <GripVertical size={18} className="shrink-0 text-white/34" />
          <Checkbox checked={item.completed} onCheckedChange={() => onToggle(item)} className="h-5 w-5 rounded-[5px] border-white/70 data-[state=checked]:border-primary data-[state=checked]:bg-primary" />
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium leading-6 ${item.completed ? "line-through text-white/38" : "text-white/88"}`}>{item.text}</p>
          </div>

          <button type="button" onClick={() => setExpanded((value) => !value)} className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/[0.035] text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white" aria-label={expanded ? "Recolher tarefa" : "Expandir tarefa"}>
            <ChevronDown size={15} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        {expanded && (
          <div className="mt-3 border-t border-white/[0.055] pt-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <button
                onClick={() => setAdding(true)}
                className="text-xs text-white/30 transition-colors hover:text-white/58"
              >
                + Subtarefa
              </button>
              <label className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-white/[0.035] px-2.5 text-xs ${priority.tone}`}>
                <select value={item.priority || "normal"} onChange={(e) => onPatch(item, { priority: e.target.value })} className="bg-transparent outline-none">
                  {PRIORITY_ORDER.map((key) => <option key={key} value={key}>{PRIORITY[key].label}</option>)}
                </select>
                <ChevronDown size={13} />
              </label>
            </div>

            <div className="space-y-0.5">
              {children.map((child) => (
                <ChecklistItemRow key={child.id} item={child} allItems={allItems} depth={depth + 1} users={users} cargos={cargos} onToggle={onToggle} onAddSub={onAddSub} onAssign={onAssign} onAssignCargo={onAssignCargo} onPatch={onPatch} />
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
                  className="ml-12 flex items-center gap-2 py-1"
                >
                  <Circle size={13} className="text-white/35" />
                  <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Subtarefa..." className="min-w-0 flex-1 bg-transparent text-sm text-white/70 outline-none placeholder:text-white/25" autoFocus />
                </form>
              )}
            </div>

            <div className="mt-3 grid grid-cols-[1fr_1.25fr] border-t border-white/[0.055] pt-3">
              <label className={`flex h-9 items-center gap-2 text-xs ${overdue ? "text-primary" : soon ? "text-amber-300" : "text-white/58"}`}>
                <CalendarDays size={15} className="text-white/50" />
                <span>{item.due_date ? dueLabel(item.due_date) : "Sem prazo"}</span>
                <input type="date" value={item.due_date || ""} onChange={(e) => onPatch(item, { due_date: e.target.value || null })} className="w-5 bg-transparent text-transparent outline-none [color-scheme:dark]" aria-label={`Prazo de ${item.text}`} />
              </label>
              <div className="flex h-9 items-center border-l border-white/[0.055] pl-4">
                <AssignResponsible item={item} users={users} cargos={cargos} onAssign={onAssign} onAssignCargo={onAssignCargo} className="h-8 border-0 bg-transparent px-0 text-xs text-white/72" />
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
