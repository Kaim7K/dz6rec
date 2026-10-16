import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquareText, Plus, Trash2 } from "lucide-react";
import CargoBadge from "@/components/CargoBadge";

const NONE = "__none__";
const DETAIL_MODE = {
  subtasks: "Subtarefas",
  notes: "Observacao",
  both: "Ambos",
};

const canUseSubtasks = (mode) => mode !== "notes";
const canUseNotes = (mode) => mode === "notes" || mode === "both";

export default function TemplateItemEditor({ item, allItems, depth, cargos, onAddSub, onSetCargo, onPatch, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [observation, setObservation] = useState(item.observation || "");
  const children = allItems.filter((i) => i.parent_id === item.id);
  const detailMode = item.detail_mode || "subtasks";

  React.useEffect(() => {
    setObservation(item.observation || "");
  }, [item.observation]);
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center gap-2 py-2.5" style={{ paddingLeft: `min(${depth * 18}px, 15%)` }}>
        <span className="min-w-0 flex-1 basis-40 text-sm leading-6 text-white/85 [overflow-wrap:anywhere]">{item.text}</span>
        <CargoBadge cargo={item.cargo} cargos={cargos} small />
        <Select value={item.cargo || undefined} onValueChange={(v) => onSetCargo(item, v === NONE ? null : v)}>
          <SelectTrigger aria-label="Cargo da tarefa do template" className="h-8 w-auto min-w-[4.5rem] border-white/[0.08] bg-white/[0.04] px-2 text-xs text-muted-foreground"><SelectValue placeholder="cargo" /></SelectTrigger>
          <SelectContent>
            {item.cargo && <SelectItem value={NONE} className="text-muted-foreground">— Limpar —</SelectItem>}
            {cargos.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {depth < 1 && (
          <Select value={detailMode} onValueChange={(value) => onPatch(item, { detail_mode: value })}>
            <SelectTrigger aria-label="Formato da tarefa do template" className="h-8 w-[7.5rem] border-white/[0.08] bg-white/[0.04] px-2 py-0 text-xs text-white/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DETAIL_MODE).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <button onClick={() => onDelete(item)} aria-label="Excluir tarefa do template" className="dz-icon-button h-8 w-8 hover:text-red-400"><Trash2 size={13} /></button>
        {depth < 1 && canUseSubtasks(detailMode) && <button onClick={() => setAdding((a) => !a)} aria-label="Adicionar subtarefa ao template" className="dz-icon-button h-8 w-8"><Plus size={13} /></button>}
      </div>
      {depth < 1 && canUseNotes(detailMode) && (
        <label className="mb-1 block min-w-0 rounded-md border border-white/[0.06] bg-white/[0.025] p-3" style={{ marginLeft: `min(${depth * 18 + 24}px, 15%)` }}>
          <span className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquareText size={12} /> Observacao
          </span>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            onBlur={() => onPatch(item, { observation: observation.trim() })}
            rows={2}
            placeholder="Texto de observacao deste item no template..."
            className="min-w-0 w-full resize-y bg-transparent text-sm leading-6 text-white/80 outline-none placeholder:text-white/50"
          />
        </label>
      )}
      {adding && canUseSubtasks(detailMode) && (
        <form onSubmit={(e) => { e.preventDefault(); onAddSub(item, text); setText(""); setAdding(false); }} className="flex min-w-0 flex-wrap items-center gap-2 py-1" style={{ paddingLeft: `min(${(depth + 1) * 18 + 24}px, 15%)` }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Subtarefa..." aria-label="Nome da subtarefa do template" className="dz-input min-w-0 flex-1 basis-32" autoFocus />
          <button className="dz-ghost-button px-3 text-xs">Adicionar</button>
        </form>
      )}
      {canUseSubtasks(detailMode) && children.map((c) => <TemplateItemEditor key={c.id} item={c} allItems={allItems} depth={depth + 1} cargos={cargos} onAddSub={onAddSub} onSetCargo={onSetCargo} onPatch={onPatch} onDelete={onDelete} />)}
    </div>
  );
}
