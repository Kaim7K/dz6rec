import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "@/api/appClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock3, ListChecks, MessageCircle, Music2, Pencil, Play, Shuffle, Trash2, Workflow } from "lucide-react";
import { usePlayer } from "@/lib/playerContext";
import { TYPE, STATUS, STATUS_ORDER, logActivity } from "@/lib/music";
import { computeProgress } from "@/lib/progress";
import EditProjectDialog from "@/components/projects/EditProjectDialog";
import TrackList from "@/components/projects/TrackList";
import ChecklistTab from "@/components/projects/ChecklistTab";
import HistoryTab from "@/components/projects/HistoryTab";
import ChatTab from "@/components/projects/ChatTab";
import ProjectProgress from "@/components/projects/ProjectProgress";
import ProjectWorkspace from "@/components/projects/ProjectWorkspace";
import DeleteProjectButton from "@/components/projects/DeleteProjectButton";
import dz6ProfileLogo from "@/assets/dz6-profile.png";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [items, setItems] = useState([]);
  const [sections, setSections] = useState([]);
  const [files, setFiles] = useState([]);
  const [artists, setArtists] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const player = usePlayer();
  const load = () => {
    Promise.all([apiClient.entities.Project.get(id), apiClient.entities.Track.filter({ project_id: id }), apiClient.entities.ChecklistItem.filter({ project_id: id }), apiClient.entities.ChecklistSection.filter({ project_id: id }), apiClient.entities.ProjectFile.filter({ project_id: id }).catch(() => []), apiClient.entities.Artist.list()]).then(([p, t, i, s, f, a]) => {
      setProject(p);
      setTracks(t.sort((a, b) => a.track_number - b.track_number));
      setItems(i);
      setSections(s);
      setFiles(f);
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
  const progress = computeProgress(items, sections);

  const tabs = [
    ["faixas", "Faixas", Music2],
    ["checklist", "Tarefas", ListChecks],
    ["operacao", "Operação", Workflow],
    ["historico", "Histórico", Clock3],
    ["chat", "Conversa", MessageCircle],
  ];
  return (
    <div className="min-w-0 space-y-5">
      <section className="dz-card relative overflow-hidden p-4 sm:p-5 lg:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(220,0,0,0.16),transparent_25rem),linear-gradient(115deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012)_58%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
        <div className="relative grid min-w-0 gap-4 [--hero-cover:17rem] sm:[--hero-cover:18rem] lg:grid-cols-[minmax(13rem,var(--hero-cover))_minmax(0,1fr)] lg:items-start lg:[--hero-cover:clamp(14rem,22vw,21rem)] xl:gap-5">
          <div className="mx-auto aspect-square w-full max-w-[17rem] overflow-hidden rounded-lg border border-white/[0.085] bg-[#100606] shadow-elev sm:mx-0 sm:w-64 lg:w-full lg:max-w-none">
            {project.cover_url ? <img src={project.cover_url} className="h-full w-full object-cover" alt="" /> : (
              <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_center,rgba(220,0,0,0.22),transparent_56%),#080505]">
                <img src={dz6ProfileLogo} alt="" className="h-full w-full object-cover opacity-95" />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col self-start">
            <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 xl:gap-3">
              <Select value={project.type} onValueChange={changeType}>
                <SelectTrigger className="h-8 w-auto gap-1.5 rounded-md border-white/[0.08] bg-white/[0.045] px-3 text-2xs font-bold uppercase tracking-[0.11em] text-white/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{Object.entries(TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={project.status} onValueChange={changeStatus}>
                <SelectTrigger className="h-8 w-auto gap-2 rounded-md border-primary/22 bg-primary/10 px-3 text-2xs font-bold uppercase tracking-[0.11em] text-white/82">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <h1 className="mt-3 break-words font-display text-2xl font-bold tracking-tight text-white sm:text-3xl xl:text-[2.25rem] xl:leading-[1.08]">{project.name}</h1>
            <p className="mt-1 text-xs text-white/55 xl:text-sm">{project.main_artist_name}{project.featuring ? ` feat. ${project.featuring}` : ""}</p>
            <p className="mt-2.5 max-w-2xl text-xs leading-5 text-white/48 xl:mt-3 xl:text-sm xl:leading-6">{project.description || "Projeto sem descrição."}</p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center xl:mt-5 xl:gap-3">
              <button onClick={() => tracks.length && player.play(tracks[0], project, tracks)} className="dz-primary-button h-9 px-4"><Play size={14} fill="currentColor" />Reproduzir</button>
              <button onClick={() => tracks.length && player.play(tracks[Math.floor(Math.random() * tracks.length)], project, tracks)} className="dz-ghost-button h-9"><Shuffle size={14} />Aleatório</button>
              <button onClick={() => setEditOpen(true)} className="dz-ghost-button h-9"><Pencil size={14} />Editar projeto</button>
              <DeleteProjectButton
                project={project}
                onDeleted={() => navigate("/projetos")}
                className="h-9 border border-white/[0.07] bg-white/[0.025] px-3 text-sm font-medium text-white/62 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-200"
              >
                <Trash2 size={14} />Excluir projeto
              </DeleteProjectButton>
            </div>

            </div>

            <ProjectProgress items={items} sections={sections} className="mt-4" />
          </div>
        </div>
      </section>

      <Tabs defaultValue="faixas" className="min-w-0 pt-1">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto overscroll-x-contain rounded-lg border border-white/[0.075] bg-white/[0.025] p-1">
          {tabs.map(([v, label, Icon]) => <TabsTrigger key={v} value={v} className="shrink-0 gap-2 rounded-md border border-transparent bg-transparent px-3 py-2 text-sm font-semibold text-white/48 transition-colors data-[state=active]:border-white/[0.08] data-[state=active]:bg-white/[0.07] data-[state=active]:text-white"><Icon size={16} />{label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="operacao" className="mt-5"><ProjectWorkspace project={project} sections={sections} items={items} files={files} onChanged={load} /></TabsContent>
        <TabsContent value="faixas" className="mt-5">
          <div className="space-y-5">
            <TrackList project={project} tracks={tracks} onChanged={load} progressPct={progress.total.pct} />
          </div>
        </TabsContent>
        <TabsContent value="checklist" className="mt-5"><ChecklistTab project={project} /></TabsContent>
        <TabsContent value="historico" className="mt-5"><HistoryTab project={project} /></TabsContent>
        <TabsContent value="chat" className="mt-5"><ChatTab project={project} /></TabsContent>
      </Tabs>

      <EditProjectDialog project={project} open={editOpen} onClose={() => setEditOpen(false)} onSaved={load} artists={artists} />
    </div>
  );
}
