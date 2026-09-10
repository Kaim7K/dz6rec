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
    <section className="min-h-[14.4rem] rounded-lg border border-white/[0.055] bg-white/[0.022] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
        <Link to="/projetos" className="inline-flex items-center gap-2 text-xs font-medium text-white/45 transition-colors hover:text-white">
          {action} <ArrowRight size={13} />
        </Link>
      </div>
      {children}
    </section>
  );
}

function MiniCover({ project }) {
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-black">
      <img src={project.cover_url || dz6ProfileLogo} alt="" className="h-full w-full object-cover" />
    </div>
  );
}

function ActionIcon({ index }) {
  const icons = [Image, UsersRound, Megaphone, Music2];
  const Icon = icons[index % icons.length];
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-white/[0.055] text-white/70">
      <Icon size={20} />
    </span>
  );
}

function ActionRow({ task, project, index }) {
  const status = /capa|aprovar|aprovação|revisar|validar/i.test(task.text || "") ? "Aguardando aprovação" : "Planejamento";
  const warn = status.includes("aprovação");
  return (
    <Link to={task.project_id ? `/projetos/${task.project_id}` : "/minhas-tarefas"} className="flex items-center gap-4 border-b border-white/[0.055] py-2.5 last:border-b-0">
      <ActionIcon index={index} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white/88">{task.text}</p>
        <p className="mt-1 truncate text-xs text-white/42">{project?.name || "Projeto"} - {project?.main_artist_name || "DZ6"}</p>
      </div>
      <span className={`rounded-full px-4 py-2 text-xs font-bold ${warn ? "bg-yellow-500/18 text-yellow-300" : "bg-white/[0.055] text-white/62"}`}>{status}</span>
    </Link>
  );
}

function ProjectRow({ project }) {
  const tone = STATUS_TONE[project.status] || STATUS_TONE.rascunho;
  return (
    <Link to={`/projetos/${project.id}`} className="flex items-center gap-4 border-b border-white/[0.055] py-2.5 last:border-b-0">
      <MiniCover project={project} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white/88">{project.name}</p>
        <p className="mt-1 truncate text-xs text-white/42">{project.main_artist_name || "Sem artista"}</p>
      </div>
      <span className={`rounded-full px-4 py-2 text-xs font-medium ${tone.bg} ${tone.text}`}>{STATUS[project.status] || project.status}</span>
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
      <div className="max-w-lg rounded-lg border border-white/[0.055] bg-white/[0.025] p-5">
        <h1 className="font-display text-2xl font-bold text-white">Não foi possível carregar o painel</h1>
        <p className="mt-2 text-sm text-white/50">{error}</p>
      </div>
    );
  }

  if (!data) return <p className="text-white/40">Carregando...</p>;

  const metrics = [
    { label: "Projetos ativos", value: data.active, icon: FolderKanban },
    { label: "Em produção", value: data.inProd, icon: Disc3 },
    { label: "Tarefas críticas", value: data.overdue, icon: ListTodo },
  ];

  return (
    <div className="space-y-4">
      <FeaturedProject project={data.featured} progress={data.byProject[data.featured?.id]} />
      <MetricStrip metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-[1fr_0.96fr]">
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
