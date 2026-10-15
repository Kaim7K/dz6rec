import FormField from "@/components/ui/form-field";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FileField from "@/components/ui/file-field";
import { apiClient } from "@/api/appClient";
import { uploadFile } from "@/lib/music";

export default function EditArtistDialog({ artist, open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", handle: "", bio: "" });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (artist) setForm({ name: artist.name || "", handle: artist.handle || "", bio: artist.bio || "" });
    setPhoto(null);
    setError("");
  }, [artist, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const data = { ...form, ...(photo ? { photo_url: await uploadFile(photo) } : {}) };
      await apiClient.entities.Artist.update(artist.id, data);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Não foi possível salvar o artista. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!loading && !nextOpen) onClose(); }}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Editar artista</DialogTitle>
          <DialogDescription>Atualize a identidade e a apresentação do artista.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="min-w-0 space-y-5">
          {error && <div role="alert" className="dz-form-error">{error}</div>}
          <fieldset disabled={loading} className="min-w-0 space-y-5">
          <FormField label="Nome"><Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome do artista" /></FormField>
          <FormField label="@usuário"><Input value={form.handle} onChange={(e) => set("handle", e.target.value)} placeholder="handle" /></FormField>
          <FormField label="Foto"><FileField value={photo} onChange={setPhoto} accept="image/*" hint="Retrato do artista" /></FormField>
          <FormField label="Bio"><Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={3} placeholder="Breve descrição" /></FormField>
          </fieldset>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="text-white/55">Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">{loading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
