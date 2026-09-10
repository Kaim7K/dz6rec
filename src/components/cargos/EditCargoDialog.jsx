import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { cargoList } from "@/lib/music";

export const COLORS = ["#c20000", "#d97706", "#0891b2", "#7c3aed", "#db2777", "#16a34a", "#ca8a04", "#0ea5e9", "#9333ea", "#dc2626"];

export default function EditCargoDialog({ cargo, onClose, onSaved }) {
  const [name, setName] = useState(cargo.name);
  const [color, setColor] = useState(cargo.color || COLORS[0]);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim() || loading) return;
    setLoading(true);
    const newName = name.trim();
    await base44.entities.Cargo.update(cargo.id, { name: newName, color });
    if (newName !== cargo.name) {
      // propaga o novo nome para perfis, seções e tarefas que usam o cargo
      const users = await base44.entities.User.list().catch(() => []);
      for (const u of users.filter((x) => cargoList(x.cargo).includes(cargo.name))) {
        await base44.entities.User.update(u.id, { cargo: cargoList(u.cargo).map((c) => (c === cargo.name ? newName : c)) });
      }
      await base44.entities.ChecklistSection.updateMany({ cargo: cargo.name }, { $set: { cargo: newName } }).catch(() => {});
      await base44.entities.ChecklistItem.updateMany({ cargo: cargo.name }, { $set: { cargo: newName } }).catch(() => {});
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
            <div className="flex flex-wrap items-center gap-2">{COLORS.map((c) => (
              <button type="button" key={c} onClick={() => setColor(c)} aria-label={c} className={`h-8 w-8 rounded-full transition-transform ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#161616]" : "ring-1 ring-white/10 hover:scale-110"}`} style={{ backgroundColor: c }} />
            ))}</div>
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