import React from "react";
import { AlertTriangle, Plus, X } from "lucide-react";

// Chip de cargo ativo — fundo claro do accent, com X para remover
export function ActiveCargoChip({ name, onRemove, big = false }) {
  return (
    <span className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md border border-stage-accent/25 bg-stage-accent-soft px-2.5 py-1 text-xs font-medium text-red-200 ${big ? "min-h-11 px-3" : ""}`}>
      <span className="min-w-0 [overflow-wrap:anywhere]">{name}</span>
      {onRemove && (
        <button type="button" onClick={() => onRemove(name)} aria-label={`Remover ${name}`} className="grid h-6 w-6 shrink-0 place-items-center rounded transition-colors hover:bg-stage-accent/15">
          <X size={14} />
        </button>
      )}
    </span>
  );
}

// Chip de cargo órfão (não existe mais no catálogo) — âmbar tracejado com alerta
export function OrphanCargoChip({ name, onRemove, big = false }) {
  return (
    <span className={`inline-flex min-w-0 max-w-full flex-wrap items-center gap-1.5 rounded-md border border-dashed border-stage-warn bg-stage-warn-soft px-2.5 py-1 text-body font-medium text-stage-warn ${big ? "min-h-11 px-3" : ""}`}>
      <AlertTriangle size={13} className="shrink-0" />
      <span className="truncate">{name}</span>
      <span className="shrink-0 text-micro font-medium text-stage-warn/70">Descontinuado</span>
      {onRemove && (
        <button type="button" onClick={() => onRemove(name)} aria-label={`Remover ${name}`} className="ml-0.5 shrink-0 rounded-full p-0.5 transition-colors hover:bg-stage-warn/15">
          <X size={14} />
        </button>
      )}
    </span>
  );
}

// Chip de cargo do catálogo disponível para adicionar — contorno, toggle
export function AddableCargoChip({ name, onAdd, big = false }) {
  return (
    <button type="button" onClick={() => onAdd(name)} className={`inline-flex min-h-8 min-w-0 max-w-full items-center gap-1.5 rounded-md border border-stage-border bg-stage-card px-2.5 py-1 text-xs font-medium text-stage-muted transition-colors hover:border-stage-accent/40 hover:bg-stage-accent-soft hover:text-red-200 ${big ? "min-h-11 px-3" : ""}`}>
      <Plus size={13} className="shrink-0" />
      <span className="min-w-0 text-left [overflow-wrap:anywhere]">{name}</span>
    </button>
  );
}
