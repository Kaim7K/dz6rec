import React, { useEffect, useState } from "react";
import PageLoading from "@/components/PageLoading";
import PageError from "@/components/PageError";
import { Link } from "react-router-dom";
import { apiClient } from "@/api/appClient";
import FeaturedProject from "@/components/home/FeaturedProject";
import MetricStrip from "@/components/home/MetricStrip";
import dz6ProfileLogo from "@/assets/dz6-profile.png";
import { ArrowRight, Disc3, FolderKanban, ListTodo } from "lucide-react";
import { isOverdue, STATUS, STATUS_TONE, taskScore } from "@/lib/music";

function Panel({ title, action = "Ver todos", children }) {
  return (
    <section className="dz-card min-w-0 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="dz-panel-title">{title}</h2>
        <Link to="/projetos" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-white">
          {action} <ArrowRight size={13} />
        </Link>
      </div>
      {children}
    </section>
  );
}

function MiniCover({ project }) {
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-white/[0.06] bg-black">
      <img src={project.cover_url || dz6ProfileLogo} alt="" className="h-full w-full object-cover" />
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
      <span className={`hidden text-xs font-medium sm:inline-flex ${overdue ? "text-red-300" : task.task_status === "em_progresso" ? "text-amber-300" : "text-muted-foreground"}`}>{status}</span>
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
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

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
        const pendingItems = items.filter((item) => !item.completed).sort((a, b) => taskScore(a) - taskScore(b));

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

  const metrics = [
    { label: "Projetos ativos", value: data.active, icon: FolderKanban },
    { label: "Em produção", value: data.inProd, icon: Disc3 },
    { label: "Tarefas críticas", value: data.overdue, icon: ListTodo },
  ];

  return (
    <div className="space-y-5">
      <h1 className="sr-only">Visão geral</h1>
      {data.featured ? <FeaturedProject project={data.featured} progress={data.byProject[data.featured?.id]} /> : <section className="dz-empty"><Disc3 size={24} className="text-muted-foreground" /><h2 className="text-lg font-semibold">Seu catálogo começa aqui</h2><p className="text-sm text-muted-foreground">Crie um projeto para organizar faixas, arquivos e entregas.</p><Link to="/projetos" className="dz-primary-button">Ver projetos<ArrowRight size={15} /></Link></section>}
      <MetricStrip metrics={metrics} />

      <div className="dz-overview-grid">
        <Panel title="Próximas ações" action="Ver projetos">
          <div>
            {!data.pendingItems.length && <p className="py-6 text-sm text-muted-foreground">Nenhuma tarefa pendente.</p>}
            {data.pendingItems.slice(0, 3).map((task) => (
              <ActionRow key={task.id} task={task} project={data.projectMap[task.project_id]} />
            ))}
          </div>
        </Panel>

        <Panel title="Outros projetos">
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
