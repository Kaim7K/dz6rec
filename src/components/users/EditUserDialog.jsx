import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Field from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/api/appClient";
import { PERMISSAO, cargoList, uploadFile } from "@/lib/music";
import FileField from "@/components/ui/file-field";
import UserCargosEditor from "@/components/users/UserCargosEditor";

const selectCls = "text-stage-ink";
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
      <DialogContent className="max-w-md text-stage-ink">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-stage-ink">Editar usuário</DialogTitle>
          <DialogDescription>Defina cargos, permissão e status de acesso.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <fieldset aria-label="Cargos" className="min-w-0">
            <UserCargosEditor value={cargosArr} onChange={setCargosArr} catalog={cargos} />
          </fieldset>
          <Field label="Permissão">
            <Select value={permissao} onValueChange={setPermissao}><SelectTrigger className={selectCls}><SelectValue /></SelectTrigger><SelectContent className={contentCls}>{Object.entries(PERMISSAO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label="Status">
            <Select value={status} onValueChange={setStatus}><SelectTrigger className={selectCls}><SelectValue /></SelectTrigger><SelectContent className={contentCls}><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent></Select>
          </Field>
          <Field label="@usuário"><Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="handle" className={selectCls + " placeholder:text-stage-muted"} /></Field>
          <Field label="Foto de perfil">
            <FileField light value={photo} onChange={setPhoto} disabled={loading} existingUrl={removePhoto ? "" : user.photo_url} existingLabel="Foto atual" onRemoveExisting={() => setRemovePhoto(true)} removeLabel="Remover foto" accept="image/*" hint="Exibida no chat e na listagem" />
            {removePhoto && !photo && <p role="status" className="text-xs text-stage-muted">A foto será removida ao salvar.</p>}
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
