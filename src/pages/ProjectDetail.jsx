import React, { useEffect, useState } from "react";
import PageLoading from "@/components/PageLoading";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import LinkedReview from "@/components/projects/LinkedReview";
import { toast } from "@/components/ui/use-toast";
import { apiClient } from "@/api/appClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock3, ListChecks, MessageCircle, Music2, Pencil, Play, Shuffle, Trash2, Workflow } from "lucide-react";
import { usePlayer } from "@/lib/playerContext";
import { TYPE, STATUS, STATUS_ORDER, logActivity } from "@/lib/music";
import { computeProgress } from "@/lib/progress";
import EditProjectDialog from "@/components/projects/EditProjectDialog";
import EditArtistDialog from "@/components/artists/EditArtistDialog";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [project, setProject] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [items, setItems] = useState([]);
  const [sections, setSections] = useState([]);
  const [files, setFiles] = useState([]);
  const [artists, setArtists] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editArtistOpen, setEditArtistOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("faixas");
  const [focusTaskId, setFocusTaskId] = useState(null);
  const player = usePlayer();
  const [loadError, setLoadError] = useState("");
  const [savingField, setSavingField] = useState("");
  const load = () => {
    return Promise.all([apiClient.entities.Project.get(id), apiClient.entities.Track.filter({ project_id: id }), apiClient.entities.ChecklistItem.filter({ project_id: id }), apiClient.entities.ChecklistSection.filter({ project_id: id }), apiClient.entities.ProjectFile.filter({ project_id: id }), apiClient.entities.Artist.list()]).then(([p, t, i, s, f, a]) => {
      setLoadError("");
      setProject(p);
      setTracks(t.sort((a, b) => a.track_number - b.track_number));
      setItems(i);
      setSections(s);
      setFiles(f);
      setArtists(a);
    }).catch(err => setLoadError(err.message || "Não foi possível carregar o projeto."));
  };
  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (["faixas", "checklist", "operacao", "historico", "chat"].includes(tab)) setActiveTab(tab);
    if (searchParams.get("task")) { setFocusTaskId(searchParams.get("task")); setActiveTab("checklist"); }
  }, [searchParams]);
  if (!project && loadError) return <div role="alert" className="dz-card p-5"><p className="text-sm text-red-200">{loadError}</p><button type="button" className="dz-ghost-button mt-3" onClick={load}>Tentar novamente</button></div>;
  if (!project) return <PageLoading variant="project" />;

  const patch = async (field, value, text) => {
    if (savingField) return;
    setSavingField(field);
    try {
    await apiClient.entities.Project.update(id, { [field]: value });
    setProject((p) => ({ ...p, [field]: value }));
    const me = await apiClient.auth.me().catch(() => null);
    await logActivity(id, text, me?.full_name);
    toast({ title: "Projeto atualizado" });
    } catch (err) { toast({ variant: "destructive", title: "Não foi possível atualizar o projeto", description: err.message }); }
    finally { setSavingField(""); }
  };
  const changeType = (v) => patch("type", v, `Tipo alterado para ${TYPE[v]}`);
  const changeStatus = (v) => patch("status", v, `Status alterado para ${STATUS[v]}`);
  const progress = computeProgress(items, sections);
  const artist = artists.find(row => row.id === project.main_artist_id);

  const tabs = [
    ["faixas", "Faixas", Music2],
    ["checklist", "Tarefas", ListChecks],
    ["operacao", "Operação", Workflow],
    ["historico", "Histórico", Clock3],
    ["chat", "Conversa", MessageCircle],
  ];
  return (
    <div className="min-w-0 space-y-5">
      {loadError && <p role="alert" className="rounded-md border border-red-500/20 p-3 text-sm text-red-200">{loadError} <button type="button" onClick={load} className="underline">Tentar novamente</button></p>}
      <section className="dz-project-header dz-card relative overflow-hidden p-4 sm:p-5 lg:p-6">
        <div className="dz-project-hero">
          <div className="dz-project-cover">
            {project.cover_url ? <img src={project.cover_url} className="h-full w-full object-cover" alt="" /> : (
              <div className="grid h-full place-items-center bg-[#080505]">
                <img src={dz6ProfileLogo} alt="" className="h-full w-full object-contain opacity-95" />
              </div>
            )}
          </div>

          <div className="dz-project-summary flex min-w-0 flex-col">
            <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 xl:gap-3">
              <Select value={project.type} onValueChange={changeType} disabled={!!savingField}>
                <SelectTrigger aria-label="Tipo do projeto" className="h-8 w-auto gap-1.5 rounded-md border-white/[0.08] bg-white/[0.045] px-3 text-xs font-medium text-white/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{Object.entries(TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={project.status} onValueChange={changeStatus} disabled={!!savingField}>
                <SelectTrigger aria-label="Status do projeto" className="h-8 w-auto gap-2 rounded-md border-white/[0.08] bg-white/[0.025] px-3 text-xs font-medium text-white/82">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <h1 className="mt-3 break-words font-display text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem] xl:text-[2rem] xl:leading-tight">{project.name}</h1>
            <p className="mt-1 text-xs text-white/55 [overflow-wrap:anywhere] xl:text-sm">{project.main_artist_name}{project.featuring ? ` feat. ${project.featuring}` : ""}</p>
            <p className="mt-2.5 max-w-2xl text-xs leading-5 text-muted-foreground xl:mt-3 xl:text-sm xl:leading-6">{project.description || "Projeto sem descrição."}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2 xl:mt-5">
              <button onClick={() => tracks.length && player.play(tracks[0], project, tracks)} className="dz-primary-button h-10 shrink-0 px-3"><Play size={14} fill="currentColor" />Reproduzir</button>
              <button aria-label="Aleatório" title="Aleatório" onClick={() => tracks.length && player.play(tracks[Math.floor(Math.random() * tracks.length)], project, tracks)} className="dz-icon-button h-10 w-10"><Shuffle size={16} /></button>
              <button aria-label="Editar projeto" title="Editar projeto" onClick={() => setEditOpen(true)} className="dz-icon-button h-10 w-10"><Pencil size={16} /></button>
              <DeleteProjectButton
                project={project}
                onDeleted={() => navigate("/projetos")}
                className="dz-icon-button h-10 w-10 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-200"
              >
                <Trash2 size={16} />
              </DeleteProjectButton>
            </div>

            </div>
          </div>
          <ProjectProgress items={items} sections={sections} className="dz-project-hero-progress" />
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0 pt-1">
        <TabsList className="dz-card h-auto w-full justify-start gap-1 overflow-x-auto overscroll-x-contain bg-[var(--surface-2)] p-1">
          {tabs.map(([v, label, Icon]) => <TabsTrigger key={v} value={v} className="shrink-0 gap-2 rounded-md border border-transparent bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-white/[0.08] data-[state=active]:bg-white/[0.07] data-[state=active]:text-white"><Icon size={16} />{label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="operacao" className="mt-5"><ProjectWorkspace project={project} artist={artist} tracks={tracks} sections={sections} items={items} files={files} onChanged={load} onOpenTasks={taskId => { setFocusTaskId(taskId); setActiveTab("checklist"); }} onOpenProject={() => setActiveTab("faixas")} onEditArtist={() => setEditArtistOpen(true)} /></TabsContent>
        <TabsContent value="faixas" className="mt-5">
          <div className="space-y-5">
            <TrackList project={project} tracks={tracks} onChanged={load} progressPct={progress.total.pct} defaultReviewerId={artist?.user_id} />
          </div>
        </TabsContent>
        <TabsContent value="checklist" className="mt-5"><ChecklistTab project={project} focusTaskId={focusTaskId} /></TabsContent>
        <TabsContent value="historico" className="mt-5"><HistoryTab project={project} /></TabsContent>
        <TabsContent value="chat" className="mt-5"><ChatTab project={project} /></TabsContent>
      </Tabs>

      <EditProjectDialog project={project} open={editOpen} onClose={() => setEditOpen(false)} onSaved={load} artists={artists} />
      <EditArtistDialog artist={artist} open={editArtistOpen} onClose={() => setEditArtistOpen(false)} onSaved={load} />
      {searchParams.get("review") && searchParams.get("record") && <LinkedReview entity={searchParams.get("review")} recordId={searchParams.get("record")} project={project} defaultReviewerId={artist?.user_id} onSaved={load} onClose={() => setSearchParams(previous => { const next = new URLSearchParams(previous); next.delete("review"); next.delete("record"); return next; }, { replace: true })} />}
    </div>
  );
}
