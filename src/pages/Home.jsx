import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/api/appClient";
import FeaturedProject from "@/components/home/FeaturedProject";
import MetricStrip from "@/components/home/MetricStrip";
import dz6ProfileLogo from "@/assets/dz6-profile.png";
import { ArrowRight, Disc3, FolderKanban, Image, ListTodo, Megaphone, Music2, UsersRound } from "lucide-react";
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

function ActionIcon({ index }) {
  const icons = [Image, UsersRound, Megaphone, Music2];
  const Icon = icons[index % icons.length];
  return (
    <span className="grid h-9 w-7 shrink-0 place-items-center text-white/64">
      <Icon size={17} />
    </span>
  );
}

function ActionRow({ task, project, index }) {
  const status = /capa|aprovar|aprovação|revisar|validar/i.test(task.text || "") ? "Aguardando aprovação" : "Planejamento";
  const warn = status.includes("aprovação");
  return (
    <Link to={task.project_id ? `/projetos/${task.project_id}?tab=checklist&task=${encodeURIComponent(task.id)}` : "/minhas-tarefas"} className="dz-list-row flex items-center gap-3 py-2.5">
      <ActionIcon index={index} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white/88">{task.text}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{project?.name || "Projeto"} - {project?.main_artist_name || "DZ6"}</p>
      </div>
      <span className={`hidden text-xs font-medium sm:inline-flex ${warn ? "text-yellow-300" : "text-white/62"}`}>{status}</span>
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

  useEffect(() => {
    Promise.all([
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
  }, []);

  if (error) {
    return (
      <div className="dz-card max-w-lg p-5">
        <h1 className="font-display text-2xl font-bold text-white">Não foi possível carregar o painel</h1>
        <p className="mt-2 text-sm text-white/50">{error}</p>
      </div>
    );
  }

  if (!data) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  const metrics = [
    { label: "Projetos ativos", value: data.active, icon: FolderKanban },
    { label: "Em produção", value: data.inProd, icon: Disc3 },
    { label: "Tarefas críticas", value: data.overdue, icon: ListTodo },
  ];

  return (
    <div className="space-y-5">
      <h1 className="sr-only">Visão geral</h1>
      <FeaturedProject project={data.featured} progress={data.byProject[data.featured?.id]} />
      <MetricStrip metrics={metrics} />

      <div className="dz-overview-grid">
        <Panel title="Próximas ações">
          <div>
            {data.pendingItems.slice(0, 3).map((task, index) => (
              <ActionRow key={task.id} task={task} project={data.projectMap[task.project_id]} index={index} />
            ))}
          </div>
        </Panel>

        <Panel title="Outros projetos">
          <div>
            {data.projects.filter((project) => project.id !== data.featured?.id).slice(0, 4).map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
