import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import AssignResponsible from "@/components/projects/AssignResponsible";
import CargoBadge from "@/components/CargoBadge";

export default function ChecklistItemRow({ item, allItems, depth, users, cargos, onToggle, onAddSub, onAssign, onAssignCargo }) {
  const children = allItems.filter((i) => i.parent_id === item.id);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  return (
    <div>
      <div className="flex items-center gap-2.5 py-1.5" style={{ paddingLeft: depth * 18 }}>
        <Checkbox checked={item.completed} onCheckedChange={() => onToggle(item)} className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
        <span className={`text-sm ${item.completed ? "line-through text-white/35" : "text-white/85"}`}>{item.text}</span>
        <CargoBadge cargo={item.cargo} cargos={cargos} small />
        <AssignResponsible item={item} users={users} cargos={cargos} onAssign={onAssign} onAssignCargo={onAssignCargo} />
        {depth < 1 && <button onClick={() => setAdding((a) => !a)} className="ml-auto rounded p-1 text-white/30 transition-colors hover:bg-white/5 hover:text-white"><Plus size={13} /></button>}
      </div>
      {adding && <form onSubmit={(e) => { e.preventDefault(); onAddSub(item, text); setText(""); setAdding(false); }} className="flex items-center gap-2 py-1" style={{ paddingLeft: (depth + 1) * 18 + 30 }}><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Subtarefa..." className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-sm outline-none placeholder:text-white/30" autoFocus /><button className="text-2xs text-white/50">Adicionar</button></form>}
      {children.map((c) => <ChecklistItemRow key={c.id} item={c} allItems={allItems} depth={depth + 1} users={users} cargos={cargos} onToggle={onToggle} onAddSub={onAddSub} onAssign={onAssign} onAssignCargo={onAssignCargo} />)}
    </div>
  );
}