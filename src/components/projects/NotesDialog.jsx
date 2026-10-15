import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/api/appClient";

export default function NotesDialog({ section, onClose }) {
  const [content, setContent] = useState("");
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { apiClient.entities.ChecklistNote.filter({ section_id: section.id }).then((n) => { setNote(n[0] || null); setContent(n[0]?.content || ""); }); }, [section.id]);
  const save = async () => {
    if (loading) return;
    setLoading(true); setError("");
    try {
      const me = await apiClient.auth.me().catch(() => null);
      if (note) await apiClient.entities.ChecklistNote.update(note.id, { content, updated_by_name: me?.full_name });
      else await apiClient.entities.ChecklistNote.create({ section_id: section.id, content, updated_by_name: me?.full_name });
      onClose();
    } catch (err) {
      setError(err.message || "Não foi possível salvar as anotações.");
    } finally { setLoading(false); }
  };
  return (
    <Dialog open onOpenChange={(value) => { if (!loading && !value) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Anotações — {section.name}</DialogTitle></DialogHeader>
        {error && <p role="alert" className="dz-form-error">{error}</p>}
        <Textarea aria-label={`Anotações de ${section.name}`} disabled={loading} value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Escreva notas internas da equipe..." />
        {note?.updated_by_name && <p className="text-2xs text-muted-foreground">Última alteração por {note.updated_by_name}</p>}
        <DialogFooter><Button variant="ghost" onClick={onClose} disabled={loading} className="text-white/55">Cancelar</Button><Button onClick={save} disabled={loading} className="bg-primary text-primary-foreground">{loading ? "Salvando..." : "Salvar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
