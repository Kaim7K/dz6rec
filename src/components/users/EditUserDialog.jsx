import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/api/appClient";
import { PERMISSAO, cargoList, uploadFile } from "@/lib/music";
import FileField from "@/components/ui/file-field";
import UserCargosEditor from "@/components/users/UserCargosEditor";
import { X } from "lucide-react";

const Field = ({ label, children }) => <div className="space-y-1.5"><Label className="text-stage-ink">{label}</Label>{children}</div>;
const selectCls = "border-stage-border bg-stage-card text-stage-ink";
const contentCls = "border-stage-border bg-stage-card text-stage-ink";

export default function EditUserDialog({ user, cargos, onClose, onSaved }) {
  const [cargosArr, setCargosArr] = useState(() => cargoList(user.cargo));
  const [permissao, setPermissao] = useState(user.permissao || "membro");
  const [status, setStatus] = useState(user.status || "ativo");
  const [handle, setHandle] = useState(user.handle || "");
  const [photo, setPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const save = async () => {
    setLoading(true);
    const data = { cargo: cargosArr, permissao, status, handle };
    if (photo) data.photo_url = await uploadFile(photo);
    else if (removePhoto) data.photo_url = "";
    await apiClient.entities.User.update(user.id, data);
    setLoading(false);
    onSaved();
    onClose();
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md border-stage-border bg-stage-card text-stage-ink">
        <DialogHeader>
          <DialogTitle className="font-jakarta text-title font-bold text-stage-ink">Editar usuário</DialogTitle>
          <DialogDescription className="text-body text-stage-muted">Defina cargos, permissão e status. Um usuário pode ter vários cargos.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <Field label="Cargos">
            <UserCargosEditor value={cargosArr} onChange={setCargosArr} catalog={cargos} />
          </Field>
          <Field label="Permissão">
            <Select value={permissao} onValueChange={setPermissao}><SelectTrigger className={selectCls}><SelectValue /></SelectTrigger><SelectContent className={contentCls}>{Object.entries(PERMISSAO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label="Status">
            <Select value={status} onValueChange={setStatus}><SelectTrigger className={selectCls}><SelectValue /></SelectTrigger><SelectContent className={contentCls}><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent></Select>
          </Field>
          <Field label="@usuário"><Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="handle" className={selectCls + " placeholder:text-stage-muted"} /></Field>
          <Field label="Foto de perfil">
            {user.photo_url && !removePhoto ? (
              <div className="mb-2 flex items-center gap-3 rounded-sl border border-stage-border bg-stage-surface px-3 py-2.5">
                <img src={user.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                <p className="flex-1 text-body text-stage-muted">Foto atual</p>
                <button type="button" onClick={() => setRemovePhoto(true)} aria-label="Remover foto" className="rounded-full p-1.5 text-stage-muted transition-colors hover:bg-stage-surface hover:text-stage-ink"><X size={14} /></button>
              </div>
            ) : null}
            <FileField light value={photo} onChange={setPhoto} accept="image/*" hint="Exibida no chat e na listagem" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-stage-muted hover:bg-stage-surface hover:text-stage-ink">Cancelar</Button>
          <Button onClick={save} disabled={loading} className="bg-stage-accent text-white hover:bg-stage-accent/90">{loading ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}