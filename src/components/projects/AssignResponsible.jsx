import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cargoColor } from "@/components/CargoBadge";

const NONE = "__none__";
const CARGO = "cargo:";

export default function AssignResponsible({ item, users, cargos = [], onAssign, onAssignCargo, className = "" }) {
  const value = item.responsible_id || (item.cargo ? CARGO + item.cargo : undefined);
  const change = (v) => {
    if (v === NONE) {
      if (item.responsible_id) onAssign?.(item, null);
      else onAssignCargo?.(item, null);
      return;
    }
    if (v.startsWith(CARGO)) onAssignCargo?.(item, v.slice(CARGO.length));
    else onAssign?.(item, users.find((u) => u.id === v) || null);
  };
  return (
    <Select value={value} onValueChange={change}>
      <SelectTrigger className={`h-6 w-auto min-w-[5.5rem] gap-1 border-white/[0.08] bg-white/[0.04] px-2 text-2xs text-white/60 hover:text-white ${className}`}>
        <SelectValue placeholder="atribuir" />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {(item.responsible_id || item.cargo) && <SelectItem value={NONE} className="text-white/45">— Remover —</SelectItem>}
        {cargos.map((c) => (
          <SelectItem key={"c" + c.name} value={CARGO + c.name}>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cargoColor(c.name, cargos) || "#888" }} />
              {c.name}
            </span>
          </SelectItem>
        ))}
        {users.map((u) => (
          <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
