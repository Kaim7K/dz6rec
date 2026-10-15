import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Field from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logActivity, taskResponsibleIds, taskResponsibleNames } from "@/lib/music";
import { notifyUsers } from "@/lib/notifications";

export default function AssignTaskDialog({ task, project, onClose, onSaved }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    apiClient.entities.User.list().then(rows => { if (active) setUsers(rows); })
      .catch(() => { if (active) setError("Não foi possível carregar os usuários. Feche e tente novamente."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const submit = async event => {
    event.preventDefault();
    if (saving) return;
    const user = users.find(row => row.id === userId);
    if (!user) { setError("Selecione um usuário para atribuir a tarefa."); return; }
    setSaving(true);
    setError("");
    try {
      const current = await apiClient.entities.ChecklistItem.get(task.id);
      const ids = taskResponsibleIds(current);
      if (ids.length >= 2 && !ids.includes(user.id)) throw new Error("Esta tarefa já tem dois responsáveis. Atualize a lista de tarefas.");
      const names = taskResponsibleNames(current);
      if (!ids.includes(user.id)) { ids.push(user.id); names.push(user.full_name || user.email); }
      await apiClient.entities.ChecklistItem.update(task.id, { responsible_ids: ids, responsible_names: names, responsible_id: ids[0], responsible_name: names[0] });
      const me = await apiClient.auth.me().catch(() => null);
      await logActivity(project.id, `Responsável definido em "${task.text}": ${user.full_name || user.email}`, me?.full_name);
      await notifyUsers([user.id], { text: `Você foi atribuído à tarefa "${task.text}" em "${project.name}"`, projectId: project.id, link: `/projetos/${project.id}?tab=checklist&task=${encodeURIComponent(task.id)}` }, me?.id).catch(() => {});
      onSaved();
      onClose();
    } catch (err) { setError(err.message || "Não foi possível atribuir a tarefa."); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Atribuir responsável</DialogTitle><DialogDescription className="[overflow-wrap:anywhere]">{task.text}</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && <p role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          <Field label="Responsável pela tarefa">
            <Select value={userId} onValueChange={id => { if (id) setUserId(id); }} disabled={loading || saving}>
              <SelectTrigger><SelectValue placeholder={loading ? "Carregando usuários..." : "Selecionar usuário"} /></SelectTrigger>
              <SelectContent>{users.map(user => <SelectItem key={user.id} value={user.id}>{user.full_name ? `${user.full_name} · ${user.email}` : user.email}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <DialogFooter><Button type="button" variant="ghost" disabled={saving} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={loading || saving || !userId}>{saving ? "Atribuindo..." : "Atribuir"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
