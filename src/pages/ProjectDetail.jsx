import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "@/api/appClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Shuffle, Pencil } from "lucide-react";
import { usePlayer } from "@/lib/playerContext";
import { TYPE, STATUS, STATUS_ORDER, logActivity } from "@/lib/music";
import EditProjectDialog from "@/components/projects/EditProjectDialog";
import TrackList from "@/components/projects/TrackList";
import ChecklistTab from "@/components/projects/ChecklistTab";
import HistoryTab from "@/components/projects/HistoryTab";
import ChatTab from "@/components/projects/ChatTab";
import ProjectProgress from "@/components/projects/ProjectProgress";

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [items, setItems] = useState([]);
  const [sections, setSections] = useState([]);
  const [artists, setArtists] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const player = usePlayer();
  const load = () => {
    Promise.all([apiClient.entities.Project.get(id), apiClient.entities.Track.filter({ project_id: id }), apiClient.entities.ChecklistItem.filter({ project_id: id }), apiClient.entities.ChecklistSection.filter({ project_id: id }), apiClient.entities.Artist.list()]).then(([p, t, i, s, a]) => {
      setProject(p);
      setTracks(t.sort((a, b) => a.track_number - b.track_number));
      setItems(i);
      setSections(s);
      setArtists(a);
    });
  };
  useEffect(() => { load(); }, [id]);
  if (!project) return <p className="text-white/40">Carregando...</p>;

  const patch = async (field, value, text) => {
    setProject((p) => ({ ...p, [field]: value }));
    await apiClient.entities.Project.update(id, { [field]: value });
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(id, text, me?.full_name);
  };
  const changeType = (v) => patch("type", v, `Tipo alterado para ${TYPE[v]}`);
  const changeStatus = (v) => patch("status", v, `Status alterado para ${STATUS[v]}`);

  const tabs = [["faixas", "Faixas"], ["checklist", "Checklist"], ["visao", "VisÃ£o geral"], ["historico", "HistÃ³rico"], ["chat", "Conversa"]];
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="aspect-square w-40 shrink-0 overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06] sm:w-52 lg:w-60">
          {project.cover_url ? <img src={project.cover_url} className="h-full w-full object-cover" alt="" /> : null}
        </div>
        <div className="flex flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={project.type} onValueChange={changeType}>
              <SelectTrigger className="h-7 w-auto gap-1.5 border-white/[0.08] bg-white/[0.03] px-2.5 text-2xs font-medium uppercase tracking-[0.14em] text-white/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>{Object.entries(TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={project.status} onValueChange={changeStatus}>
            <SelectTrigger className="h-7 w-auto gap-1.5 border-white/[0.08] bg-white/[0.03] px-2.5 text-2xs font-medium uppercase tracking-[0.14em] text-white/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>{STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS[s]}</SelectItem>)}</SelectContent>
            </Select>
            <button onClick={() => setEditOpen(true)} aria-label="Editar projeto" className="rounded-full p-2 text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white"><Pencil size={15} /></button>
            </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">{project.name}</h1>
          <p className="mt-1.5 text-white/50">{project.main_artist_name}{project.featuring ? ` feat. ${project.featuring}` : ""}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button onClick={() => tracks.length && player.play(tracks[0], project, tracks)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"><Play size={16} fill="currentColor" />Reproduzir</button>
            <button onClick={() => tracks.length && player.play(tracks[Math.floor(Math.random() * tracks.length)], project, tracks)} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/5"><Shuffle size={15} />AleatÃ³rio</button>
          </div>
        </div>
      </div>

      <ProjectProgress items={items} sections={sections} />

      <Tabs defaultValue="faixas">
        <TabsList className="h-auto w-full justify-start gap-6 border-b border-white/[0.06] bg-transparent p-0">
          {tabs.map(([v, label]) => <TabsTrigger key={v} value={v} className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-2 text-sm text-white/45 transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-white">{label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="faixas" className="mt-6"><TrackList project={project} tracks={tracks} onChanged={load} /></TabsContent>
        <TabsContent value="checklist" className="mt-6"><ChecklistTab project={project} /></TabsContent>
        <TabsContent value="visao" className="mt-6"><div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6"><p className="text-sm leading-relaxed text-white/65">{project.description || "Sem descriÃ§Ã£o."}</p>{project.release_date && <p className="mt-4 text-xs text-white/40">LanÃ§amento previsto Â· {new Date(project.release_date).toLocaleDateString("pt-BR")}</p>}</div></TabsContent>
        <TabsContent value="historico" className="mt-6"><HistoryTab project={project} /></TabsContent>
        <TabsContent value="chat" className="mt-6"><ChatTab project={project} /></TabsContent>
      </Tabs>

      <EditProjectDialog project={project} open={editOpen} onClose={() => setEditOpen(false)} onSaved={load} artists={artists} />
    </div>
  );
}