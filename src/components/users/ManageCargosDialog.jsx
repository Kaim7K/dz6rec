import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
        <p className="truncate font-display text-section font-semibold text-stage-ink">{user.full_name || "Usuário"}</p>
        <p className="truncate text-micro text-stage-muted">{user.email}{user.handle ? ` · @${user.handle}` : ""}</p>
      </div>
    </div>
  );
}

export default function ManageCargosDialog({ user, catalog, onClose, onSaved }) {
  const isMobile = useIsMobile();
  const [value, setValue] = useState(() => cargoList(user.cargo));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
    await apiClient.entities.User.update(user.id, { cargo: value });

    onSaved();
    onClose();
    } catch (err) {
      setError(err.message || "Não foi possível salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const actions = (
    <div className="flex gap-2.5">
      <Button variant="outline" onClick={onClose} className="h-11 flex-1 rounded-sl border-stage-border bg-stage-card text-body font-medium text-stage-muted hover:bg-stage-surface hover:text-stage-ink">Cancelar</Button>
      <Button onClick={save} disabled={loading} className="h-11 flex-1 rounded-sl bg-stage-accent text-body font-semibold text-white hover:bg-stage-accent/90">{loading ? "Salvando..." : "Salvar Alterações"}</Button>
    </div>
  );

  const editor = <>{error && <p role="alert" className="dz-form-error mb-4">{error}</p>}<UserCargosEditor value={value} onChange={setValue} catalog={catalog} layout={isMobile ? "sheet" : "modal"} /></>;

  if (isMobile) return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <DrawerContent aria-describedby={undefined} className="max-h-[88dvh] overflow-hidden border-stage-border bg-stage-card text-stage-ink">
        <div className="border-b border-stage-border px-4 pb-3 pt-1">
          <DrawerTitle className="font-display text-section font-semibold text-stage-ink">Editar Cargos</DrawerTitle>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <UserSummary user={user} />
          <div className="mt-5">{editor}</div>
        </div>
        <div className="border-t border-stage-border bg-stage-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{actions}</div>
      </DrawerContent>
    </Drawer>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] border-stage-border bg-stage-card text-stage-ink">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold text-stage-ink">Editar Cargos</DialogTitle>
          <DialogDescription className="text-body text-stage-muted">Adicione ou remova os cargos deste usuário. Cargos descontinuados também podem ser removidos aqui.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[52vh] overflow-y-auto pr-1">
          <UserSummary user={user} />
          <div className="mt-5">{editor}</div>
        </div>
        <div className="mt-4 border-t border-stage-border pt-4">{actions}</div>
      </DialogContent>
    </Dialog>
  );
}
