import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [editing, setEditing] = useState(null);
  const load = () => apiClient.entities.Artist.list().then(setArtists);
  useEffect(() => { load(); }, []);
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    let photo_url = ""; if (photo) photo_url = await uploadFile(photo);
    await apiClient.entities.Artist.create({ ...form, photo_url });
    setLoading(false); setForm({ name: "", handle: "", bio: "" }); setPhoto(null); setOpen(false); load();
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-2xs font-medium uppercase tracking-[0.18em] text-white/35">Roster</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">Artistas</h1>
          <p className="mt-1.5 text-white/45">Pessoas e usuários da gravadora.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"><Plus size={16} />Novo artista</button>
      </div>
      {artists.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-12 text-center text-sm text-white/35">Nenhum artista cadastrado.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{artists.map((a) => (
          <div key={a.id} className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] transition-colors hover:border-white/[0.1]">
            <div className="aspect-[4/3] w-full overflow-hidden bg-white/[0.04]">{a.photo_url ? <img src={a.photo_url} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" alt="" /> : <div className="grid h-full place-items-center"><Mic2 className="text-white/15" size={28} /></div>}</div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div><p className="font-medium text-white">{a.name}</p><p className="text-xs text-white/40">{a.handle ? `@${a.handle}` : "—"}</p></div>
              <button onClick={() => setEditing(a)} aria-label={`Editar ${a.name}`} className="rounded-full p-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"><Pencil size={15} /></button>
            </div>
          </div>
        ))}</div>
      )}
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Novo artista</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5"><Label>Nome</Label><Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome do artista" /></div>
          <div className="space-y-1.5"><Label>@usuário</Label><Input value={form.handle} onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))} placeholder="handle" /></div>
          <div className="space-y-1.5"><Label>Foto</Label><FileField value={photo} onChange={setPhoto} accept="image/*" hint="Retrato do artista" /></div>
          <div className="space-y-1.5"><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Breve descrição" /></div>
          <DialogFooter><Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-white/55">Cancelar</Button><Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">{loading ? "Criando..." : "Criar artista"}</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>
      <EditArtistDialog artist={editing} open={!!editing} onClose={() => setEditing(null)} onSaved={load} />
    </div>
  );
}