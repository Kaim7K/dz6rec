import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cargoColor } from "@/components/CargoBadge";
import ChatAvatar from "@/components/projects/ChatAvatar";

const NONE = "__none__";
const CARGO = "cargo:";

export default function AssignResponsible({ item, users, cargos = [], onAssign, onAssignCargo, className = "" }) {
  const value = item.responsible_id || (item.cargo ? CARGO + item.cargo : undefined);
  const selectedUser = users.find((user) => user.id === item.responsible_id);
  const selectedCargo = item.cargo ? cargos.find((cargo) => cargo.name === item.cargo) || { name: item.cargo } : null;
  const label = selectedUser?.full_name || selectedUser?.email || item.responsible_name || selectedCargo?.name || "atribuir";

  const change = (nextValue) => {
    if (nextValue === NONE) {
      onAssign?.(item, null);
      onAssignCargo?.(item, null);
      return;
    }
    if (nextValue.startsWith(CARGO)) onAssignCargo?.(item, nextValue.slice(CARGO.length));
    else onAssign?.(item, users.find((user) => user.id === nextValue) || null);
  };

  return (
    <Select value={value} onValueChange={change}>
      <SelectTrigger className={`h-7 w-auto min-w-[7.5rem] max-w-full gap-2 rounded-md border-white/[0.08] bg-white/[0.04] px-2 text-2xs text-white/70 hover:border-white/[0.14] hover:bg-white/[0.055] hover:text-white ${className}`}>
        <span className="flex min-w-0 items-center gap-2">
          {selectedUser ? (
            <ChatAvatar name={label} photoUrl={selectedUser.photo_url} size={20} />
          ) : selectedCargo ? (
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cargoColor(selectedCargo.name, cargos) || "#888" }} />
          ) : (
            <span className="h-2 w-2 shrink-0 rounded-full bg-white/24" />
          )}
          <span className="truncate">{label}</span>
        </span>
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {(item.responsible_id || item.cargo) && <SelectItem value={NONE} className="text-white/45">Remover atribuição</SelectItem>}
        {cargos.map((cargo) => (
          <SelectItem key={`cargo-${cargo.name}`} value={CARGO + cargo.name}>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cargoColor(cargo.name, cargos) || "#888" }} />
              {cargo.name}
            </span>
          </SelectItem>
        ))}
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <span className="flex items-center gap-2">
              <ChatAvatar name={user.full_name || user.email} photoUrl={user.photo_url} size={18} />
              <span>{user.full_name || user.email}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
