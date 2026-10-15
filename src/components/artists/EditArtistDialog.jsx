import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Field from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import FileField from "@/components/ui/file-field";
import { apiClient } from "@/api/appClient";
import { uploadFile } from "@/lib/music";
import ArtistUserField from "@/components/artists/ArtistUserField";

export default function EditArtistDialog({ artist, open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", handle: "", bio: "" });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);

  useEffect(() => {
    if (artist) setForm({ name: artist.name || "", handle: artist.handle || "", bio: artist.bio || "", user_id: artist.user_id || "" });
    setPhoto(null);
    setRemovePhoto(false);
    setError("");
  }, [artist, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const data = { ...form, ...(photo ? { photo_url: await uploadFile(photo) } : removePhoto ? { photo_url: "" } : {}) };
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar artista</DialogTitle>
          <DialogDescription>Atualize o perfil e a foto do artista.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && <div role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
          <fieldset disabled={loading} className="space-y-4">
          <Field label="Nome"><Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome do artista" /></Field>
          <Field label="@usuário"><Input value={form.handle} onChange={(e) => set("handle", e.target.value)} placeholder="handle" /></Field>
          <ArtistUserField value={form.user_id} onChange={user_id => set("user_id", user_id)} disabled={loading} />
          <Field label="Foto"><FileField value={photo} onChange={setPhoto} disabled={loading} existingUrl={removePhoto ? "" : artist?.photo_url} existingLabel="Foto atual" onRemoveExisting={() => setRemovePhoto(true)} removeLabel="Remover foto" accept="image/*" hint="Retrato do artista" />{removePhoto && !photo && <p role="status" className="text-xs text-white/55">A foto será removida ao salvar.</p>}</Field>
          <Field label="Bio"><Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={3} placeholder="Breve descrição" /></Field>
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
