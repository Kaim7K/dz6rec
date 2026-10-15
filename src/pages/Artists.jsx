import PageSkeleton from "@/components/PageSkeleton";
import FormField from "@/components/ui/form-field";
import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile } from "@/lib/music";
import FileField from "@/components/ui/file-field";
import EditArtistDialog from "@/components/artists/EditArtistDialog";
import { Mic2, Plus, Pencil } from "lucide-react";

export default function Artists() {
  const [artists, setArtists] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", handle: "", bio: "" });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const load = () => apiClient.entities.Artist.list().then(setArtists).catch((err) => setLoadError(err.message || "Não foi possível carregar os artistas.")).finally(() => setLoaded(true));
  useEffect(() => { load(); }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError("");
    try {
      const photo_url = photo ? await uploadFile(photo) : "";
      await apiClient.entities.Artist.create({ ...form, photo_url });
      setForm({ name: "", handle: "", bio: "" }); setPhoto(null); setOpen(false); load();
    } catch (err) {
      setError(err.message || "Não foi possível criar o artista. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };
  if (!loaded) return <PageSkeleton cards />;
  if (loadError) return <div role="alert" className="dz-form-error">{loadError}</div>;
  return (
    <div className="dz-page">
      <div className="dz-page-head">
        <div>
          <p className="dz-kicker">Roster</p>
          <h1 className="dz-page-title">Artistas</h1>
          <p className="dz-page-subtitle">Pessoas, vozes e identidades que movimentam os projetos.</p>
        </div>
        <button onClick={() => { setError(""); setOpen(true); }} className="dz-primary-button"><Plus size={16} />Novo artista</button>
      </div>
      {artists.length === 0 ? (
        <div className="dz-empty">Nenhum artista cadastrado.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{artists.map((a) => (
          <div key={a.id} className="dz-card group overflow-hidden p-3 transition-colors duration-300 hover:border-white/[0.14] hover:bg-[#171414]">
            <div className="aspect-square w-full overflow-hidden rounded-md border border-white/[0.07] bg-black">{a.photo_url ? <img src={a.photo_url} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" alt="" /> : <div className="grid h-full place-items-center bg-white/[0.02]"><Mic2 className="text-muted-foreground" size={28} /></div>}</div>
            <div className="flex items-center justify-between gap-3 px-1 pb-1 pt-4">
              <div><p className="font-medium text-white">{a.name}</p><p className="text-xs text-muted-foreground">{a.handle ? `@${a.handle}` : "—"}</p></div>
              <button onClick={() => setEditing(a)} aria-label={`Editar ${a.name}`} className="dz-icon-button h-8 w-8"><Pencil size={15} /></button>
            </div>
          </div>
        ))}</div>
      )}
      <Dialog open={open} onOpenChange={(nextOpen) => { if (!loading) setOpen(nextOpen); }}><DialogContent className="max-w-[480px]"><DialogHeader><DialogTitle>Novo artista</DialogTitle><DialogDescription>Adicione um novo nome ao catálogo da gravadora.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="min-w-0 space-y-5">
          {error && <div role="alert" className="dz-form-error">{error}</div>}
          <fieldset disabled={loading} className="min-w-0 space-y-5">
          <FormField label="Nome"><Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome do artista" /></FormField>
          <FormField label="@usuário"><Input value={form.handle} onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))} placeholder="handle" /></FormField>
          <FormField label="Foto"><FileField value={photo} onChange={setPhoto} accept="image/*" hint="Retrato do artista" /></FormField>
          <FormField label="Bio"><Textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Breve descrição" /></FormField>
          </fieldset>
          <DialogFooter><Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="text-white/55">Cancelar</Button><Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">{loading ? "Criando..." : "Criar artista"}</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>
      <EditArtistDialog artist={editing} open={!!editing} onClose={() => setEditing(null)} onSaved={load} />
    </div>
  );
}
