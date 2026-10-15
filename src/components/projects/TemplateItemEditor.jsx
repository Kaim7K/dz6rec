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
    <div>
      <div className="flex flex-wrap items-center gap-2 py-1.5" style={{ paddingLeft: depth * 18 }}>
        <span className="min-w-0 flex-1 text-sm text-white/85">{item.text}</span>
        <CargoBadge cargo={item.cargo} cargos={cargos} small />
        <Select value={item.cargo || undefined} onValueChange={(v) => onSetCargo(item, v === NONE ? null : v)}>
          <SelectTrigger className="h-6 w-auto min-w-[4.5rem] border-white/[0.08] bg-white/[0.04] px-2 text-2xs text-muted-foreground"><SelectValue placeholder="cargo" /></SelectTrigger>
          <SelectContent>
            {item.cargo && <SelectItem value={NONE} className="text-muted-foreground">— Limpar —</SelectItem>}
            {cargos.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {depth < 1 && (
          <Select value={detailMode} onValueChange={(value) => onPatch(item, { detail_mode: value })}>
            <SelectTrigger className="h-7 w-[7.5rem] border-white/[0.08] bg-white/[0.04] px-2 py-0 text-2xs text-white/55">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DETAIL_MODE).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <button onClick={() => onDelete(item)} className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-red-400"><Trash2 size={13} /></button>
        {depth < 1 && canUseSubtasks(detailMode) && <button onClick={() => setAdding((a) => !a)} className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"><Plus size={13} /></button>}
      </div>
      {depth < 1 && canUseNotes(detailMode) && (
        <label className="mb-1 block rounded-lg border border-white/[0.06] bg-white/[0.025] p-2" style={{ marginLeft: depth * 18 + 24 }}>
          <span className="mb-1 flex items-center gap-1.5 text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            <MessageSquareText size={12} /> Observacao
          </span>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            onBlur={() => onPatch(item, { observation: observation.trim() })}
            rows={2}
            placeholder="Texto de observacao deste item no template..."
            className="w-full resize-y bg-transparent text-xs leading-5 text-white/65 outline-none placeholder:text-white/25"
          />
        </label>
      )}
      {adding && canUseSubtasks(detailMode) && (
        <form onSubmit={(e) => { e.preventDefault(); onAddSub(item, text); setText(""); setAdding(false); }} className="flex items-center gap-2 py-1" style={{ paddingLeft: (depth + 1) * 18 + 24 }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Subtarefa..." className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-sm outline-none placeholder:text-white/30" autoFocus />
          <button className="text-2xs text-white/50">Adicionar</button>
        </form>
      )}
      {canUseSubtasks(detailMode) && children.map((c) => <TemplateItemEditor key={c.id} item={c} allItems={allItems} depth={depth + 1} cargos={cargos} onAddSub={onAddSub} onSetCargo={onSetCargo} onPatch={onPatch} onDelete={onDelete} />)}
    </div>
  );
}
