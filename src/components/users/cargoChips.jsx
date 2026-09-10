import React from "react";
import { AlertTriangle, Plus, X } from "lucide-react";

// Chip de cargo ativo â€” fundo claro do accent, com X para remover
export function ActiveCargoChip({ name, onRemove, big = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border border-stage-accent/20 bg-stage-accent-soft px-2.5 py-1 text-body font-medium text-stage-accent ${big ? "min-h-11 px-3" : ""}`}>
      {name}
      {onRemove && (
        <button type="button" onClick={() => onRemove(name)} aria-label={`Remover ${name}`} className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-stage-accent/15">
          <X size={14} />
        </button>
      )}
    </span>
  );
}

// Chip de cargo Ã³rfÃ£o (nÃ£o existe mais no catÃ¡logo) â€” Ã¢mbar tracejado com alerta
export function OrphanCargoChip({ name, onRemove, big = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border border-dashed border-stage-warn bg-stage-warn-soft px-2.5 py-1 text-body font-medium text-stage-warn ${big ? "min-h-11 px-3" : ""}`}>
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

// Chip de cargo do catÃ¡logo disponÃ­vel para adicionar â€” contorno, toggle
export function AddableCargoChip({ name, onAdd, big = false }) {
  return (
    <button type="button" onClick={() => onAdd(name)} className={`inline-flex items-center gap-1.5 rounded-md border border-stage-border bg-stage-card px-2.5 py-1 text-body font-medium text-stage-muted transition-colors hover:border-stage-accent/40 hover:bg-stage-accent-soft hover:text-stage-accent ${big ? "min-h-11 px-3" : ""}`}>
      <Plus size={13} className="shrink-0" />
      {name}
    </button>
  );
}