import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/appClient";
import { cargoList } from "@/lib/music";
import UserCargosEditor from "@/components/users/UserCargosEditor";

function UserSummary({ user }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-stage-accent-soft text-body font-semibold text-stage-accent">
        {user.photo_url ? <img src={user.photo_url} alt="" className="h-full w-full object-cover" /> : (user.full_name || user.email || "U")[0].toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-base font-semibold text-stage-ink">{user.full_name || "Usuário"}</p>
        <p className="truncate text-micro text-stage-muted">{user.email}{user.handle ? ` · @${user.handle}` : ""}</p>
      </div>
    </div>
  );
}

export default function ManageCargosDialog({ user, catalog, onClose, onSaved }) {
  const isMobile = useIsMobile();
  const [value, setValue] = useState(() => cargoList(user.cargo));
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (loading) return;
    setLoading(true);
    await apiClient.entities.User.update(user.id, { cargo: value });
    setLoading(false);
    onSaved();
    onClose();
  };

  const actions = (
    <>
      <Button variant="ghost" onClick={onClose}>Cancelar</Button>
      <Button onClick={save} disabled={loading}>{loading ? "Salvando..." : "Salvar alterações"}</Button>
    </>
  );

  const editor = <UserCargosEditor value={value} onChange={setValue} catalog={catalog} layout={isMobile ? "sheet" : "modal"} />;

  if (isMobile) return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[88vh] border-stage-border bg-stage-card text-stage-ink">
        <div className="border-b border-stage-border px-4 pb-3 pt-1">
          <DrawerTitle className="font-display text-base font-semibold text-stage-ink">Editar Cargos</DrawerTitle>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <UserSummary user={user} />
          <div className="mt-5">{editor}</div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-stage-border bg-stage-card p-4">{actions}</div>
      </DrawerContent>
    </Drawer>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] text-stage-ink">
        <DialogHeader>
          <DialogTitle className="text-stage-ink">Editar Cargos</DialogTitle>
          <DialogDescription>Adicione ou remova cargos deste usuário, incluindo os descontinuados.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[52vh] overflow-y-auto pr-1">
          <UserSummary user={user} />
          <div className="mt-5">{editor}</div>
        </div>
        <DialogFooter>{actions}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
