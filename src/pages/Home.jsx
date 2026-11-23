import React, { useEffect, useState } from "react";
import PageLoading from "@/components/PageLoading";
import PageError from "@/components/PageError";
import { Link } from "react-router-dom";
import { apiClient } from "@/api/appClient";
import FeaturedProject from "@/components/home/FeaturedProject";
import MetricStrip from "@/components/home/MetricStrip";
import dz6ProfileLogo from "@/assets/dz6-profile.png";
import { ArrowRight, Disc3, FolderKanban, ListTodo } from "lucide-react";
import { dueLabel, isDueSoon, isOverdue, STATUS, STATUS_TONE, taskResponsibleIds, taskResponsibleNames, taskScore } from "@/lib/music";
import { useAuth } from "@/lib/AuthContext";
import { reviewStatus } from "@/lib/reviews";

function Panel({ title, action = "", to = "/projetos", children }) {
  return (
    <section className="min-w-0 border-t border-white/[0.08] pt-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="dz-panel-title">{title}</h2>
        {action && <Link to={to} className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-white">
          {action} <ArrowRight size={13} />
        </Link>}
      </div>
      {children}
    </section>
  );
}

function MiniCover({ project }) {
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-white/[0.06] bg-black">
      <img src={project.cover_thumbnail_url || project.cover_url || dz6ProfileLogo} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
    </div>
  );
}

function ActionIcon() {
  return (
    <span className="grid h-9 w-7 shrink-0 place-items-center text-white/64">
      <ListTodo size={17} />
    </span>
  );
}

function ActionRow({ task, project }) {
  const overdue = isOverdue(task.due_date, task.completed);
  const status = overdue ? "Atrasada" : task.task_status === "em_progresso" ? "Em andamento" : "Pendente";
  return (
    <Link to={task.project_id ? `/projetos/${task.project_id}?tab=checklist&task=${encodeURIComponent(task.id)}` : "/minhas-tarefas"} className="dz-list-row flex items-center gap-3 py-2.5">
      <ActionIcon />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white/88">{task.text}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{project?.name || "Projeto"} - {project?.main_artist_name || "DZ6"}</p>
      </div>
      <span className={`shrink-0 text-xs font-medium ${overdue ? "text-red-300" : task.task_status === "em_progresso" ? "text-amber-300" : "text-muted-foreground"}`}>{task.due_date ? dueLabel(task.due_date) : status}</span>
    </Link>
  );
}

function ProjectRow({ project }) {
  const tone = STATUS_TONE[project.status] || STATUS_TONE.rascunho;
  return (
    <Link to={`/projetos/${project.id}`} className="dz-list-row flex items-center gap-3 py-2.5">
      <MiniCover project={project} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white/88">{project.name}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{project.main_artist_name || "Sem artista"}</p>
      </div>
      <span className={`hidden items-center gap-2 text-xs font-medium sm:inline-flex ${tone.text}`}><span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />{STATUS[project.status] || project.status}</span>
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState(null);
  const [reviewError, setReviewError] = useState(false);
  const [reviewAttempt, setReviewAttempt] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const filter = { reviewer_id: user.id, review_status: "revisao" };
    setReviewError(false);
    setReviews(null);
    Promise.all([
      apiClient.entities.ProjectFile.filter(filter),
      apiClient.entities.TrackVersion.filter(filter),
    ]).then(async ([files, versions]) => {
      const trackIds = [...new Set(versions.map(version => version.track_id))];
      const tracks = trackIds.length ? await apiClient.entities.Track.list() : [];
      const projectByTrack = new Map(tracks.map(track => [track.id, track.project_id]));
      const entries = [
        ...files.map(artifact => ({ entity: "ProjectFile", artifact, projectId: artifact.project_id })),
        ...versions.map(artifact => ({ entity: "TrackVersion", artifact, projectId: projectByTrack.get(artifact.track_id) })),
      ];
      if (active) setReviews(entries.filter(({ entity, artifact, projectId }) => projectId && reviewStatus(entity, artifact) === "revisao"));
    }).catch(() => { if (active) setReviewError(true); });
    return () => { active = false; };
  }, [user?.id, reviewAttempt]);

  const load = () => {
    setError("");
    return Promise.all([
      apiClient.entities.Project.list("-created_date"),
      apiClient.entities.ChecklistItem.list(),
    ])
      .then(([projects, items]) => {
        const byProject = {};
        items.forEach((item) => {
          if (!item.project_id) return;
          byProject[item.project_id] = byProject[item.project_id] || { d: 0, t: 0 };
          byProject[item.project_id].t += 1;
          if (item.completed) byProject[item.project_id].d += 1;
        });

        const projectMap = {};
        projects.forEach((project) => (projectMap[project.id] = project));
        const activeProjects = projects.filter((project) => !["lancado", "arquivado"].includes(project.status));
        const featured = activeProjects[0] || projects[0] || null;
        const pendingItems = items.filter(item => !item.completed && item.task_status !== "concluido" && activeProjects.some(project => project.id === item.project_id))
          .sort((a, b) => taskScore(a) - taskScore(b));

        setData({
          projects: activeProjects.length ? activeProjects : projects,
          featured,
          projectMap,
          byProject,
          active: activeProjects.length,
          inProd: projects.filter((project) => project.status === "producao").length,
          overdue: items.filter((item) => isOverdue(item.due_date, item.completed)).length,
          pendingItems,
        });
      })
      .catch((err) => setError(err.message || "Não foi possível carregar o painel."));
  };
  useEffect(() => { load(); }, []);

  if (error) {
    return <PageError message={error} onRetry={load} />;
  }

  if (!data) return <PageLoading variant="project" />;

  const ownTasks = user ? data.pendingItems.filter(item =>
    taskResponsibleIds(item).includes(user.id) ||
    [user.full_name, user.email].filter(Boolean).some(name => taskResponsibleNames(item).includes(name))
  ) : [];
  const upcoming = data.pendingItems.filter(item => isOverdue(item.due_date) || isDueSoon(item.due_date))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  const metrics = [
    { label: "Projetos ativos", value: data.active, icon: FolderKanban },
    { label: "Em produção", value: data.inProd, icon: Disc3 },
    { label: "Tarefas críticas", value: data.overdue, icon: ListTodo },
  ];

  return (
    <div className="dz-page dz-home">
      <header className="dz-page-head">
        <div><p className="dz-kicker">Workspace</p><h1 className="dz-page-title">Visão geral</h1><p className="dz-page-subtitle">Projetos, entregas e o próximo passo da gravadora.</p></div>
        <Link to="/projetos" className="dz-ghost-button">Ver catálogo <ArrowRight size={15} /></Link>
      </header>
      {data.featured ? <FeaturedProject project={data.featured} progress={data.byProject[data.featured?.id]} /> : <section className="dz-empty"><Disc3 size={24} className="text-muted-foreground" /><h2 className="text-lg font-semibold">Seu catálogo começa aqui</h2><p className="text-sm text-muted-foreground">Crie um projeto para organizar faixas, arquivos e entregas.</p><Link to="/projetos" className="dz-primary-button">Ver projetos<ArrowRight size={15} /></Link></section>}
      <MetricStrip metrics={metrics} />

      <div className="dz-overview-grid">
        <Panel title="Minhas tarefas" action="Ver minhas tarefas" to="/minhas-tarefas">
          <div>
            {!ownTasks.length && <p className="py-6 text-sm text-muted-foreground">Nenhuma tarefa pendente atribuída a você.</p>}
            {ownTasks.slice(0, 3).map((task) => (
              <ActionRow key={task.id} task={task} project={data.projectMap[task.project_id]} />
            ))}
          </div>
        </Panel>

        <Panel title="Aguardando minha aprovação">
          {reviewError ? (
            <p role="alert" className="py-4 text-sm text-muted-foreground">Falha ao carregar aprovações. <button type="button" onClick={() => setReviewAttempt(value => value + 1)} className="underline">Tentar novamente</button></p>
          ) : !reviews ? (
            <p role="status" className="py-4 text-sm text-muted-foreground">Carregando aprovações…</p>
          ) : !reviews.length ? (
            <p className="py-6 text-sm text-muted-foreground">Nenhum arquivo aguardando sua aprovação.</p>
          ) : reviews.map(({ entity, artifact, projectId }) => (
            <Link key={`${entity}-${artifact.id}`} to={`/projetos/${projectId}?tab=${entity === "TrackVersion" ? "faixas" : "operacao"}&review=${entity}&record=${encodeURIComponent(artifact.id)}`} className="dz-list-row flex items-center gap-3 py-2.5">
              <ActionIcon />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{artifact.name}</span><span className="block truncate text-xs text-muted-foreground">{data.projectMap[projectId]?.name || "Projeto"}</span></span>
              <ArrowRight size={14} className="shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </Panel>

        <Panel title="Prazos próximos e atrasados">
          {!upcoming.length && <p className="py-6 text-sm text-muted-foreground">Nenhum prazo próximo ou atrasado.</p>}
          {upcoming.slice(0, 5).map(task => <ActionRow key={task.id} task={task} project={data.projectMap[task.project_id]} />)}
        </Panel>

        <Panel title="Outros projetos" action="Ver catálogo">
          <div>
            {!data.projects.some(project => project.id !== data.featured?.id) && <p className="py-6 text-sm text-muted-foreground">Nenhum outro projeto no momento.</p>}
            {data.projects.filter((project) => project.id !== data.featured?.id).slice(0, 4).map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
