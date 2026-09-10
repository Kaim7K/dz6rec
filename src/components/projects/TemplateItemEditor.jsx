import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import CargoBadge from "@/components/CargoBadge";

const NONE = "__none__";

export default function TemplateItemEditor({ item, allItems, depth, cargos, onAddSub, onSetCargo, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const children = allItems.filter((i) => i.parent_id === item.id);
  return (
    <div>
      <div className="flex items-center gap-2 py-1.5" style={{ paddingLeft: depth * 18 }}>
        <span className="text-sm text-white/85">{item.text}</span>
        <CargoBadge cargo={item.cargo} cargos={cargos} small />
        <Select value={item.cargo || undefined} onValueChange={(v) => onSetCargo(item, v === NONE ? null : v)}>
          <SelectTrigger className="h-6 w-auto min-w-[4.5rem] border-white/[0.08] bg-white/[0.04] px-2 text-2xs text-white/45"><SelectValue placeholder="cargo" /></SelectTrigger>
          <SelectContent>
            {item.cargo && <SelectItem value={NONE} className="text-white/45">— Limpar —</SelectItem>}
            {cargos.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <button onClick={() => onDelete(item)} className="rounded p-1 text-white/25 transition-colors hover:bg-white/5 hover:text-red-400"><Trash2 size={13} /></button>
        {depth < 1 && <button onClick={() => setAdding((a) => !a)} className="ml-auto rounded p-1 text-white/30 transition-colors hover:bg-white/5 hover:text-white"><Plus size={13} /></button>}
      </div>
      {adding && (
        <form onSubmit={(e) => { e.preventDefault(); onAddSub(item, text); setText(""); setAdding(false); }} className="flex items-center gap-2 py-1" style={{ paddingLeft: (depth + 1) * 18 + 24 }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Subtarefa..." className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-sm outline-none placeholder:text-white/30" autoFocus />
          <button className="text-2xs text-white/50">Adicionar</button>
        </form>
      )}
      {children.map((c) => <TemplateItemEditor key={c.id} item={c} allItems={allItems} depth={depth + 1} cargos={cargos} onAddSub={onAddSub} onSetCargo={onSetCargo} onDelete={onDelete} />)}
    </div>
  );
}