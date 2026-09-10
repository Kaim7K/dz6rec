import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FileField from "@/components/ui/file-field";
import { apiClient } from "@/api/appClient";
import { uploadFile } from "@/lib/music";

export default function EditArtistDialog({ artist, open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", handle: "", bio: "" });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (artist) setForm({ name: artist.name || "", handle: artist.handle || "", bio: artist.bio || "" });
    setPhoto(null);
  }, [artist, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = { ...form };
    if (photo) data.photo_url = await uploadFile(photo);
    await apiClient.entities.Artist.update(artist.id, data);
    setLoading(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar artista</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5"><Label>Nome</Label><Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome do artista" /></div>
          <div className="space-y-1.5"><Label>@usuário</Label><Input value={form.handle} onChange={(e) => set("handle", e.target.value)} placeholder="handle" /></div>
          <div className="space-y-1.5"><Label>Foto</Label><FileField value={photo} onChange={setPhoto} accept="image/*" hint="Retrato do artista" /></div>
          <div className="space-y-1.5"><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={3} placeholder="Breve descrição" /></div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} className="text-white/55">Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">{loading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}