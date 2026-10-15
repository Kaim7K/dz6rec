import React from "react";
import { AlertTriangle } from "lucide-react";
import { ActiveCargoChip, AddableCargoChip, OrphanCargoChip } from "@/components/users/cargoChips";

const SectionTitle = ({ children }) => <h3 className="text-sm font-semibold text-stage-ink">{children}</h3>;
const EmptyHint = ({ children }) => <p className="text-body text-stage-muted">{children}</p>;

export default function UserCargosEditor({ value = [], onChange, catalog = [], layout = "modal" }) {
  const active = value.filter(Boolean);
  const catalogNames = catalog.map((c) => c.name);
  const orphans = active.filter((n) => !catalogNames.includes(n));
  const registered = active.filter((n) => catalogNames.includes(n));
  const addable = catalogNames.filter((n) => !active.includes(n));
  const remove = (name) => onChange(active.filter((n) => n !== name));
  const add = (name) => onChange([...active, name]);

  if (layout === "sheet") {
    return (
      <div className="space-y-5">
        <div className="space-y-2.5">
          <SectionTitle>Cargos Atuais</SectionTitle>
          {registered.length === 0 ? <EmptyHint>Nenhum cargo atribuído.</EmptyHint> : (
            <div className="flex flex-col items-start gap-2">{registered.map((n) => <ActiveCargoChip key={n} name={n} onRemove={remove} big />)}</div>
          )}
        </div>
        {orphans.length > 0 && (
          <div className="space-y-2.5 rounded-sl border border-dashed border-stage-warn bg-stage-warn-soft p-3">
            <div className="flex items-center gap-1.5 text-body font-semibold text-stage-warn"><AlertTriangle size={14} />Cargos Órfãos</div>
            <p className="text-micro text-stage-warn/80">Este perfil tem cargos que não existem mais no catálogo.</p>
            <div className="flex flex-col items-start gap-2">{orphans.map((n) => <OrphanCargoChip key={n} name={n} onRemove={remove} big />)}</div>
          </div>
        )}
        <div className="space-y-2.5">
          <SectionTitle>Adicionar Cargos</SectionTitle>
          {addable.length === 0 ? <EmptyHint>Todos os cargos do catálogo já estão atribuídos.</EmptyHint> : (
            <div className="flex flex-wrap gap-2">{addable.map((n) => <AddableCargoChip key={n} name={n} onAdd={add} big />)}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <SectionTitle>Cargos Atuais</SectionTitle>
        {active.length === 0 ? <EmptyHint>Nenhum cargo atribuído.</EmptyHint> : (
          <div className="flex flex-wrap gap-2">
            {active.map((n) => orphans.includes(n)
              ? <OrphanCargoChip key={n} name={n} onRemove={remove} />
              : <ActiveCargoChip key={n} name={n} onRemove={remove} />)}
          </div>
        )}
      </div>
      <div className="space-y-2.5">
        <SectionTitle>Adicionar Cargos</SectionTitle>
        {addable.length === 0 ? <EmptyHint>Todos os cargos do catálogo já estão atribuídos.</EmptyHint> : (
          <div className="flex flex-wrap gap-2">{addable.map((n) => <AddableCargoChip key={n} name={n} onAdd={add} />)}</div>
        )}
      </div>
    </div>
  );
}
