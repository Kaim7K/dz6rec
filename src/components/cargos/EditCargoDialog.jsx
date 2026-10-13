import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/api/appClient";
import { cargoList } from "@/lib/music";

export const COLORS = ["#dc0000", "#b91c1c", "#991b1b", "#7f1d1d", "#ef4444", "#d97706", "#a3a3a3", "#737373", "#525252", "#f5f5f5"];

export const randomCargoColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export function ColorSelect({ value, onChange, triggerClassName = "" }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`h-10 min-w-[10.5rem] rounded-md border-white/[0.08] bg-white/[0.026] text-sm text-white ${triggerClassName}`}>
        <span className="flex min-w-0 items-center gap-2">
          <span className="h-4 w-4 shrink-0 rounded-full border border-white/20" style={{ backgroundColor: value }} />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        {COLORS.map((hex) => (
          <SelectItem key={hex} value={hex}>
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: hex }} />
              <span className="font-mono text-xs uppercase">{hex}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
    await apiClient.entities.Cargo.update(cargo.id, { name: newName, color });
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
          <div className="space-y-1.5"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do cargo" /></div>
          <div className="space-y-1.5"><Label>Cor</Label>
            <ColorSelect value={color} onChange={setColor} triggerClassName="w-full" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-white/55">Cancelar</Button>
          <Button onClick={save} disabled={loading || !name.trim()} className="bg-primary text-primary-foreground">{loading ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
