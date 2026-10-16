import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import PageLoading from "@/components/PageLoading";
import PageError from "@/components/PageError";
import DeleteConfirmation from "@/components/DeleteConfirmation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Field from "@/components/ui/form-field";
import { LayoutTemplate, Pencil, Plus, Trash2 } from "lucide-react";
import TemplateEditorDialog from "@/components/templates/TemplateEditorDialog";

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = () => {
    setLoading(true); setLoadError("");
    return Promise.all([apiClient.entities.ChecklistTemplate.list(), apiClient.entities.Cargo.list()])
      .then(([t, c]) => { setTemplates(t); setCargos(c); })
      .catch(err => setLoadError(err.message || "Não foi possível carregar os templates."))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const create = async (e) => {
    e.preventDefault(); if (!name.trim() || saving) return;
    setSaving(true); setError("");
    try { await apiClient.entities.ChecklistTemplate.create({ name, project_type: "custom" }); setName(""); setOpen(false); load(); }
    catch (err) { setError(err.message || "Não foi possível criar o template. Tente novamente."); }
    finally { setSaving(false); }
  };
  const remove = async (t) => {
    return apiClient.entities.ChecklistTemplate.delete(t.id);
  };
  if (loading) return <PageLoading />;
  if (loadError) return <PageError message={loadError} onRetry={load} />;
  return (
    <div className="dz-page">
      <div className="dz-page-head">
        <div>
          <p className="dz-kicker">Estrutura</p>
          <h1 className="dz-page-title">Templates</h1>
          <p className="dz-page-subtitle">Checklists reutilizáveis para manter lançamentos no mesmo padrão.</p>
        </div>
        <button onClick={() => { setError(""); setOpen(true); }} className="dz-primary-button"><Plus size={16} />Novo template</button>
      </div>
      {templates.length === 0 ? (
        <div className="dz-empty">Nenhum template ainda.</div>
      ) : (
        <div className="dz-card overflow-hidden">{templates.map((t) => (
          <div key={t.id} className="dz-list-row group flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-7 shrink-0 place-items-center text-muted-foreground"><LayoutTemplate size={18} /></div>
              <div><p className="font-medium text-white">{t.name}</p><p className="text-2xs text-muted-foreground">Aplicável ao criar um projeto · editável</p></div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button onClick={() => setEditing(t)} aria-label={`Editar template ${t.name}`} className="dz-icon-button h-8 w-8"><Pencil size={15} /></button>
              <DeleteConfirmation title="Excluir template" onConfirm={() => remove(t)} onDeleted={load} trigger={<button type="button" aria-label={`Excluir template ${t.name}`} className="dz-icon-button h-8 w-8 hover:text-red-400"><Trash2 size={15} /></button>}>Tem certeza que deseja excluir <span className="font-medium text-white">{t.name}</span>? As seções e tarefas deste template também serão removidas.</DeleteConfirmation>
            </div>
          </div>
        ))}</div>
      )}
      <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Novo template</DialogTitle><DialogDescription>Crie uma estrutura de tarefas para reutilizar nos projetos.</DialogDescription></DialogHeader>
        <form onSubmit={create} className="space-y-4">{error && <p role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}<Field label="Nome"><Input required disabled={saving} value={name} onChange={(e) => setName(e.target.value)} placeholder="Lançamento de Single" /></Field><DialogFooter className="mt-5"><Button type="button" variant="ghost" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving || !name.trim()} className="bg-primary text-primary-foreground">{saving ? 'Criando...' : 'Criar'}</Button></DialogFooter></form>
      </DialogContent></Dialog>
      {editing && <TemplateEditorDialog template={editing} cargos={cargos} onClose={() => setEditing(null)} />}
    </div>
  );
}
