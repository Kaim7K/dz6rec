import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/api/appClient";

export default function NotesDialog({ section, onClose }) {
  const [content, setContent] = useState("");
  const [note, setNote] = useState(null);
  useEffect(() => { apiClient.entities.ChecklistNote.filter({ section_id: section.id }).then((n) => { setNote(n[0] || null); setContent(n[0]?.content || ""); }); }, [section.id]);
  const save = async () => { const me = await apiClient.auth.me().catch(() => null); if (note) await apiClient.entities.ChecklistNote.update(note.id, { content, updated_by_name: me?.full_name }); else await apiClient.entities.ChecklistNote.create({ section_id: section.id, content, updated_by_name: me?.full_name }); onClose(); };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Anotações — {section.name}</DialogTitle></DialogHeader>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Escreva notas internas da equipe..." />
        {note?.updated_by_name && <p className="text-2xs text-white/35">Última alteração por {note.updated_by_name}</p>}
        <DialogFooter><Button variant="ghost" onClick={onClose} className="text-white/55">Cancelar</Button><Button onClick={save} className="bg-primary text-primary-foreground">Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}