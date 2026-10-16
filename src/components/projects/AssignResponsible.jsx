import React from "react";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cargoColor } from "@/components/CargoBadge";
import ChatAvatar from "@/components/projects/ChatAvatar";
import { taskResponsibleIds } from "@/lib/music";

const NONE = "__none__";
const CARGO = "cargo:";
const MAX_RESPONSIBLES = 2;

export default function AssignResponsible({ item, users, cargos = [], onAssign, onUnassign, onAssignCargo, className = "" }) {
  const selectedIds = taskResponsibleIds(item);
  const selectedUsers = selectedIds.map((id) => users.find((user) => user.id === id)).filter(Boolean);
  const selectedCargo = item.cargo ? cargos.find((cargo) => cargo.name === item.cargo) || { name: item.cargo } : null;
  const label = selectedUsers.length >= MAX_RESPONSIBLES ? "limite atingido" : selectedUsers.length ? "adicionar" : selectedCargo?.name || "atribuir";

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
    <div className={`flex min-w-0 flex-wrap items-center gap-1.5 ${className}`}>
      {selectedUsers.map((user) => {
        const name = user.full_name || user.email;
        return (
          <span key={user.id} className="inline-flex h-7 max-w-[9rem] items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.045] pl-1 pr-1.5 text-2xs text-white/78">
            <ChatAvatar name={name} photoUrl={user.photo_url} size={18} />
            <span className="truncate">{name}</span>
            <button type="button" onClick={() => onUnassign?.(item, user)} className="grid h-4 w-4 shrink-0 place-items-center rounded text-muted-foreground hover:bg-white/10 hover:text-white" aria-label={`Desatribuir ${name}`}>
              <X size={11} />
            </button>
          </span>
        );
      })}
      {selectedUsers.length < MAX_RESPONSIBLES && (
        <Select value={undefined} onValueChange={change}>
          <SelectTrigger aria-label="Atribuir responsável" className="h-7 w-auto min-w-[7.5rem] max-w-full gap-2 rounded-md border-white/[0.08] bg-white/[0.04] px-2 text-2xs text-white/70 hover:border-white/[0.14] hover:bg-white/[0.055] hover:text-white">
            <span className="flex min-w-0 items-center gap-2">
              {selectedCargo && !selectedUsers.length ? (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cargoColor(selectedCargo.name, cargos) || "#888" }} />
              ) : (
                <span className="h-2 w-2 shrink-0 rounded-full bg-white/24" />
              )}
              <span className="truncate">{label}</span>
            </span>
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {(selectedUsers.length > 0 || item.cargo) && <SelectItem value={NONE} className="text-muted-foreground">Remover atribuicao</SelectItem>}
            {cargos.map((cargo) => (
              <SelectItem key={`cargo-${cargo.name}`} value={CARGO + cargo.name} accentColor={cargoColor(cargo.name, cargos)}>{cargo.name}</SelectItem>
            ))}
            {users.filter((user) => !selectedIds.includes(user.id)).map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <span className="flex items-center gap-2">
                  <ChatAvatar name={user.full_name || user.email} photoUrl={user.photo_url} size={18} />
                  <span>{user.full_name || user.email}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
