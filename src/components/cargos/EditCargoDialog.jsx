import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Field from "@/components/ui/form-field";
import { apiClient } from "@/api/appClient";
import { cargoList } from "@/lib/music";

const FALLBACK_COLOR = "#DC0000";
const HEX_COLOR = /^#[0-9A-F]{6}$/i;

const normalizeHexColor = (value) => {
  const cleaned = String(value || "")
    .trim()
    .replace(/^#/, "")
    .replace(/[^0-9a-f]/gi, "")
    .slice(0, 6);

  return `#${cleaned.padEnd(6, "0")}`.toUpperCase();
};

export const randomCargoColor = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0").toUpperCase()}`;

export function ColorSelect({ value, onChange, triggerClassName = "" }) {
  const normalizedValue = HEX_COLOR.test(value || "") ? value.toUpperCase() : normalizeHexColor(value || FALLBACK_COLOR);
  const [draft, setDraft] = useState(normalizedValue);

  useEffect(() => {
    setDraft(normalizedValue);
  }, [normalizedValue]);

  const commit = (nextValue) => {
    const normalized = HEX_COLOR.test(nextValue || "") ? nextValue.toUpperCase() : normalizeHexColor(nextValue || FALLBACK_COLOR);
    setDraft(normalized);
    onChange(normalized);
  };

  const handleTextChange = (event) => {
    const nextValue = event.target.value.toUpperCase();
    setDraft(nextValue);
    if (HEX_COLOR.test(nextValue)) onChange(nextValue);
  };

  return (
    <div className={`flex h-10 min-w-[12rem] items-center gap-2 rounded-md border border-white/[0.095] bg-white/[0.035] px-2 text-white shadow-sm transition-colors focus-within:border-primary/50 focus-within:bg-white/[0.055] ${triggerClassName}`}>
      <input
        type="color"
        value={normalizedValue}
        onChange={(event) => commit(event.target.value)}
        className="h-7 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
        aria-label="Escolher cor do cargo"
      />
      <Input
        value={draft}
        onChange={handleTextChange}
        onBlur={() => commit(draft)}
        placeholder="#DC0000"
        maxLength={7}
        className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1 font-mono text-xs uppercase text-white shadow-none focus-visible:ring-0"
        aria-label="Codigo hexadecimal da cor"
      />
    </div>
  );
}

export default function EditCargoDialog({ cargo, onClose, onSaved }) {
  const [name, setName] = useState(cargo.name);
  const [color, setColor] = useState(cargo.color || randomCargoColor());
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim() || loading) return;
    setLoading(true);
    const newName = name.trim();
    await apiClient.entities.Cargo.update(cargo.id, { name: newName, color: normalizeHexColor(color) });
    if (newName !== cargo.name) {
      // propaga o novo nome para perfis, seções e tarefas que usam o cargo
      const users = await apiClient.entities.User.list().catch(() => []);
      for (const u of users.filter((x) => cargoList(x.cargo).includes(cargo.name))) {
        await apiClient.entities.User.update(u.id, { cargo: cargoList(u.cargo).map((c) => (c === cargo.name ? newName : c)) });
      }
      await apiClient.entities.ChecklistSection.updateMany({ cargo: cargo.name }, { $set: { cargo: newName } }).catch(() => {});
      await apiClient.entities.ChecklistItem.updateMany({ cargo: cargo.name }, { $set: { cargo: newName } }).catch(() => {});
    }
    setLoading(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar cargo</DialogTitle>
          <DialogDescription>Altere o nome ou a cor. A alteração se aplica a todos os perfis e tarefas que usam este cargo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <Field label="Nome"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do cargo" /></Field>
          <Field label="Cor">
            <ColorSelect value={color} onChange={setColor} triggerClassName="w-full" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-white/55">Cancelar</Button>
          <Button onClick={save} disabled={loading || !name.trim()} className="bg-primary text-primary-foreground">{loading ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
