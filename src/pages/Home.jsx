import PageSkeleton from "@/components/PageSkeleton";
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
    <section className="dz-card min-h-[14.4rem] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
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
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/[0.06] bg-white/[0.035] text-white/64">
      <Icon size={20} />
    </span>
  );
}

function ActionRow({ task, project, index }) {
  const status = /capa|aprovar|aprovação|revisar|validar/i.test(task.text || "") ? "Aguardando aprovação" : "Planejamento";
  const warn = status.includes("aprovação");
  return (
    <Link to={task.project_id ? `/projetos/${task.project_id}` : "/minhas-tarefas"} className="dz-list-row flex items-center gap-3 py-2.5">
      <ActionIcon index={index} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white/88">{task.text}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{project?.name || "Projeto"} - {project?.main_artist_name || "DZ6"}</p>
      </div>
      <span className={`hidden rounded-md px-2.5 py-1 text-xs font-semibold sm:inline-flex ${warn ? "bg-yellow-500/15 text-yellow-300" : "bg-white/[0.04] text-white/62"}`}>{status}</span>
    </Link>
  );
}

function ProjectRow({ project }) {
  const tone = STATUS_TONE[project.status] || STATUS_TONE.rascunho;
  return (
    <Link to={`/projetos/${project.id}`} className="dz-list-row flex items-center gap-3 py-2.5">
      <MiniCover project={project} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white/88">{project.name}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{project.main_artist_name || "Sem artista"}</p>
      </div>
      <span className={`hidden rounded-md px-2.5 py-1 text-xs font-medium sm:inline-flex ${tone.bg} ${tone.text}`}>{STATUS[project.status] || project.status}</span>
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
        <h1 className="font-display text-2xl font-semibold text-white">Não foi possível carregar o painel</h1>
        <p className="mt-2 text-sm text-white/50">{error}</p>
      </div>
    );
  }

  if (!data) return <PageSkeleton />;

  const metrics = [
    { label: "Projetos ativos", value: data.active, icon: FolderKanban },
    { label: "Em produção", value: data.inProd, icon: Disc3 },
    { label: "Tarefas críticas", value: data.overdue, icon: ListTodo },
  ];

  return (
    <div className="dz-page">
      <header className="dz-page-head"><div><p className="dz-kicker">Gravadora</p><h1 className="dz-page-title">Visão geral</h1><p className="dz-page-subtitle">Projetos, entregas e próximos passos da equipe.</p></div></header>
      <FeaturedProject project={data.featured} progress={data.byProject[data.featured?.id]} />
      <MetricStrip metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Próximas ações">
          <div>
            {data.pendingItems.slice(0, 3).map((task, index) => (
              <ActionRow key={task.id} task={task} project={data.projectMap[task.project_id]} index={index} />
            ))}
            {data.pendingItems.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Tudo em dia. Nenhuma ação pendente.</p>}
          </div>
        </Panel>

        <Panel title="Outros projetos">
          <div>
            {data.projects.filter((project) => project.id !== data.featured?.id).slice(0, 4).map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
            {data.projects.filter((project) => project.id !== data.featured?.id).length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum outro projeto por aqui.</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
