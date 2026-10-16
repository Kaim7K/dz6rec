import { PRIORITY_COLORS } from "@/lib/choiceColors";
import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Circle, GripVertical, MessageSquareText, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import AssignResponsible from "@/components/projects/AssignResponsible";
import ChatAvatar from "@/components/projects/ChatAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dueLabel, isDueSoon, isOverdue, PRIORITY, PRIORITY_ORDER, taskResponsibleIds } from "@/lib/music";

const DETAIL_MODE = {
  subtasks: "Subtarefas",
  notes: "Observacao",
  both: "Ambos",
};

const canUseSubtasks = (mode) => mode !== "notes";
const canUseNotes = (mode) => mode === "notes" || mode === "both";

export default function ChecklistItemRow({ item, allItems, depth, users, cargos, onToggle, onAddSub, onAssign, onUnassign, onAssignCargo, onPatch, onDelete, provided = undefined, isDragging = false, focused = false }) {
  const rowRef = useRef(null);
  const children = allItems.filter((i) => i.parent_id === item.id);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!focused) return;
    setExpanded(true);
    rowRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    rowRef.current?.focus({ preventScroll: true });
  }, [focused]);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [observation, setObservation] = useState(item.observation || "");
  const detailMode = item.detail_mode || "subtasks";
  const priority = PRIORITY[item.priority || "normal"] || PRIORITY.normal;
  const overdue = isOverdue(item.due_date, item.completed);
  const soon = isDueSoon(item.due_date, item.completed);
  const responsibleUsers = taskResponsibleIds(item).map((id) => users.find((user) => user.id === id)).filter(Boolean);

  React.useEffect(() => {
    setObservation(item.observation || "");
  }, [item.observation]);

  if (depth > 0) {
    return (
      <div className="group ml-8 flex items-center gap-2 py-0.5 text-xs">
        <Checkbox aria-label={`${item.completed ? "Reabrir" : "Concluir"} tarefa: ${item.text}`} checked={item.completed} onCheckedChange={() => onToggle(item)} className="h-4 w-4 rounded-full border-white/45 data-[state=checked]:border-primary data-[state=checked]:bg-primary" />
        <span className={`min-w-0 flex-1 ${item.completed ? "line-through text-muted-foreground" : "text-white/52"}`}>{item.text}</span>
        <button type="button" onClick={() => onDelete(item)} aria-label={`Excluir ${item.text}`} className="rounded p-1 text-muted-foreground opacity-0 transition-colors hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100">
          <Trash2 size={12} />
        </button>
      </div>
    );
  }

  return (
    <article
      ref={node => { rowRef.current = node; provided?.innerRef?.(node); }}
      tabIndex={-1}
      data-task-id={item.id}
      {...(provided?.draggableProps || {})}
      className={`overflow-hidden rounded-md border border-white/[0.075] bg-[var(--surface-3)] ${isDragging ? "border-primary/35 bg-white/[0.055] shadow-elev" : ""}`}
    >
      <div className="p-2.5">
        <div className="flex items-center gap-2">
          <button type="button" {...(provided?.dragHandleProps || {})} className="shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground transition-colors hover:bg-white/[0.045] hover:text-white/65 active:cursor-grabbing" aria-label={`Mover ${item.text}`}>
            <GripVertical size={15} />
          </button>
          <Checkbox aria-label={`${item.completed ? "Reabrir" : "Concluir"} tarefa: ${item.text}`} checked={item.completed} onCheckedChange={() => onToggle(item)} className="h-4 w-4 rounded-[4px] border-white/60 data-[state=checked]:border-primary data-[state=checked]:bg-primary" />
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium leading-5 [overflow-wrap:anywhere] ${item.completed ? "line-through text-muted-foreground" : "text-white/88"}`}>{item.text}</p>
          </div>
          {responsibleUsers.length > 0 && (
            <div className="flex shrink-0 -space-x-1.5">
              {responsibleUsers.map((user) => (
                <span key={user.id} className="rounded-full ring-2 ring-[#171414]" title={user.full_name || user.email}>
                  <ChatAvatar name={user.full_name || user.email} photoUrl={user.photo_url} size={22} />
                </span>
              ))}
            </div>
          )}

          <button type="button" onClick={() => onDelete(item)} className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/[0.02] text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-300" aria-label={`Excluir ${item.text}`}>
            <Trash2 size={13} />
          </button>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/[0.03] text-muted-foreground transition-colors hover:bg-white/[0.055] hover:text-white" aria-label={expanded ? "Recolher tarefa" : "Expandir tarefa"}>
            <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        {expanded && (
          <div className="mt-2 border-t border-white/[0.05] pt-2">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <div className="flex h-7 items-center gap-1.5 rounded-md bg-white/[0.035] pl-2 text-2xs text-white/50">
                  <span className="text-muted-foreground">Tipo</span>
                  <Select value={detailMode} onValueChange={(value) => onPatch(item, { detail_mode: value })}>
                    <SelectTrigger aria-label="Formato da tarefa" className="h-7 w-[7.75rem] border-0 bg-transparent px-1.5 py-0 text-2xs shadow-none focus:bg-transparent [&>svg]:h-3 [&>svg]:w-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DETAIL_MODE).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {canUseSubtasks(detailMode) && (
                  <button
                    onClick={() => setAdding(true)}
                    className="h-7 rounded-md bg-white/[0.025] px-2 text-2xs text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-white/65"
                  >
                    + Subtarefa
                  </button>
                )}
              </div>
              <Select value={item.priority || "normal"} onValueChange={(value) => onPatch(item, { priority: value })}>
                <SelectTrigger accentColor={PRIORITY_COLORS[item.priority || "normal"]} aria-label="Prioridade da tarefa" className={`h-7 w-[6.5rem] shrink-0 border-0 bg-white/[0.035] px-2 py-0 text-2xs shadow-none focus:bg-white/[0.045] [&>svg]:h-3 [&>svg]:w-3 ${priority.tone}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_ORDER.map((key) => <SelectItem key={key} value={key} accentColor={PRIORITY_COLORS[key]}>{PRIORITY[key].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {canUseSubtasks(detailMode) && (
              <div className="space-y-0.5">
                {children.map((child) => (
                  <ChecklistItemRow key={child.id} item={child} allItems={allItems} depth={depth + 1} users={users} cargos={cargos} onToggle={onToggle} onAddSub={onAddSub} onAssign={onAssign} onUnassign={onUnassign} onAssignCargo={onAssignCargo} onPatch={onPatch} onDelete={onDelete} />
                ))}
                {adding && (
                  <form
                    onSubmit={async e => {
                      e.preventDefault();
                      if (!text.trim()) return;
                      if (await onAddSub(item, text) !== false) { setText(""); setAdding(false); }
                    }}
                    className="ml-8 flex items-center gap-2 py-0.5"
                  >
                    <Circle size={13} className="text-muted-foreground" />
                    <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Subtarefa..." className="min-w-0 flex-1 bg-transparent text-xs text-white/70 outline-none placeholder:text-white/25" autoFocus />
                  </form>
                )}
              </div>
            )}

            {canUseNotes(detailMode) && (
              <label className="mt-2 block rounded-md border border-white/[0.055] bg-black/10 p-2 focus-within:border-primary/35">
                <span className="mb-1.5 flex items-center gap-1.5 text-2xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  <MessageSquareText size={13} /> Observacao
                </span>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  onBlur={() => onPatch(item, { observation: observation.trim() })}
                  rows={3}
                  placeholder="Adicione um contexto, link, criterio de aprovacao ou briefing desta tarefa..."
                  className="min-h-16 w-full resize-y bg-transparent text-sm leading-5 text-white/72 outline-none placeholder:text-white/25"
                />
              </label>
            )}

            <div className="mt-2 grid gap-1.5 border-t border-white/[0.05] pt-2 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] sm:gap-0">
              <label className={`flex h-8 items-center gap-2 text-2xs ${overdue ? "text-red-300" : soon ? "text-amber-300" : "text-white/58"}`}>
                <CalendarDays size={15} className="text-white/50" />
                <span>{item.due_date ? dueLabel(item.due_date) : "Sem prazo"}</span>
                <input type="date" value={item.due_date || ""} onChange={(e) => onPatch(item, { due_date: e.target.value || null })} className="w-5 bg-transparent text-transparent outline-none [color-scheme:dark]" aria-label={`Prazo de ${item.text}`} />
              </label>
              <div className="flex min-w-0 items-center sm:border-l sm:border-white/[0.055] sm:pl-3">
                <AssignResponsible item={item} users={users} cargos={cargos} onAssign={onAssign} onUnassign={onUnassign} onAssignCargo={onAssignCargo} className="w-full justify-between" />
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
