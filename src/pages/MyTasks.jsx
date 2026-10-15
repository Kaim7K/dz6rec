import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { apiClient } from "@/api/appClient";
import CargoBadge from "@/components/CargoBadge";
import ChatAvatar from "@/components/projects/ChatAvatar";
import { dueLabel, isDueSoon, isOverdue, PRIORITY, STATUS, taskResponsibleIds, taskResponsibleNames, taskScore } from "@/lib/music";
import { CheckCircle2, Clock3, ExternalLink, GripVertical, Loader2, PlayCircle, TimerReset } from "lucide-react";

const COLUMNS = [
  {
    key: "pendente",
    label: "Pendente",
    description: "Ainda não iniciadas",
    Icon: Clock3,
    tone: "text-white/55",
  },
  {
    key: "em_progresso",
    label: "Em progresso",
    description: "Entregas em andamento",
    Icon: PlayCircle,
    tone: "text-amber-300",
  },
  {
    key: "concluido",
    label: "Concluído",
    description: "Finalizadas em projetos ativos",
    Icon: CheckCircle2,
    tone: "text-emerald-300",
  },
];

function taskStage(task) {
  if (task.completed || task.task_status === "concluido") return "concluido";
  if (task.task_status === "em_progresso") return "em_progresso";
  return "pendente";
}

function TaskMeta({ task, project, cargos }) {
  const priority = PRIORITY[task.priority || "normal"];
  const overdue = isOverdue(task.due_date, task.completed);
  const soon = isDueSoon(task.due_date, task.completed);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      {project?.name && (
        <Link to={`/projetos/${project.id}?tab=checklist&task=${encodeURIComponent(task.id)}`} className="inline-flex h-7 max-w-full items-center gap-1.5 text-xs text-white/75 hover:text-white">
          <span className="truncate">{project.name}</span>
          <ExternalLink size={12} />
        </Link>
      )}
      {project?.status && (
        <span className="inline-flex h-7 items-center text-xs text-muted-foreground">{STATUS[project.status] || project.status}</span>
      )}
      {priority && (
        <span className={`inline-flex h-7 items-center text-xs ${priority.tone}`}>{priority.label}</span>
      )}
      {task.due_date && (
        <span className={`inline-flex h-7 items-center text-xs ${overdue ? "text-red-300" : soon ? "text-amber-300" : "text-muted-foreground"}`}>
          {dueLabel(task.due_date)}
        </span>
      )}
      {task.cargo && <CargoBadge cargo={task.cargo} cargos={cargos} small />}
    </div>
  );
}

function TaskCard({ task, project, cargos, users, provided, isDragging }) {
  const stage = taskStage(task);
  const overdue = isOverdue(task.due_date, task.completed);
  const responsibleUsers = taskResponsibleIds(task).map((id) => users.find((user) => user.id === id)).filter(Boolean);
  const responsibleLabel = taskResponsibleNames(task).join(", ");
  const stageTone = overdue ? "border-primary/25 bg-[var(--surface-2)]" : "border-white/[0.08] bg-[var(--surface-2)]";

  return (
    <article ref={provided.innerRef} {...provided.draggableProps} className={`min-w-0 rounded-md border p-3 transition-colors hover:border-white/[0.14] ${stageTone} ${isDragging ? "border-primary/50 bg-white/[0.075] shadow-elev" : ""}`}>
      <div className="flex items-start gap-2.5">
        <button type="button" {...provided.dragHandleProps} className="mt-0.5 shrink-0 cursor-grab rounded p-0.5 text-muted-foreground hover:bg-white/[0.05] hover:text-white/70 active:cursor-grabbing" aria-label={`Mover ${task.text}`}>
          <GripVertical size={14} />
        </button>
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${stage === "concluido" ? "bg-emerald-400" : stage === "em_progresso" ? "bg-amber-400" : overdue ? "bg-primary" : "bg-white/35"}`} />
        <div className="min-w-0 flex-1">
          <p className={`break-words text-sm font-semibold leading-5 ${stage === "concluido" ? "text-white/55 line-through" : "text-white/88"}`}>
            {task.text}
          </p>
          {responsibleLabel && <p className="mt-0.5 truncate text-2xs text-muted-foreground">Atribuida a {responsibleLabel}</p>}
        </div>
        {responsibleUsers.length > 0 && (
          <div className="flex shrink-0 -space-x-1.5">
            {responsibleUsers.map((user) => (
              <span key={user.id} className="rounded-full ring-2 ring-[#151212]" title={user.full_name || user.email}>
                <ChatAvatar name={user.full_name || user.email} photoUrl={user.photo_url} size={22} />
              </span>
            ))}
          </div>
        )}
      </div>

      <TaskMeta task={task} project={project} cargos={cargos} />
    </article>
  );
}

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState({});
  const [cargos, setCargos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const me = await apiClient.auth.me();
      const [items, projectRows, cargoRows, userRows] = await Promise.all([
        apiClient.entities.ChecklistItem.list(),
        apiClient.entities.Project.list(),
        apiClient.entities.Cargo.list().catch(() => []),
        apiClient.entities.User.list().catch(() => []),
      ]);

      const projectMap = Object.fromEntries(projectRows.map((project) => [project.id, project]));
      const mine = items
        .filter((item) => taskResponsibleIds(item).includes(me.id) || taskResponsibleNames(item).includes(me.full_name) || taskResponsibleNames(item).includes(me.email))
        .filter((item) => projectMap[item.project_id]?.status !== "lancado")
        .sort((a, b) => taskScore(a) - taskScore(b));

      setProjects(projectMap);
      setTasks(mine);
      setCargos(cargoRows);
      setUsers(userRows);
    } catch (err) {
      setError(err.message || "Nao foi possivel carregar suas tarefas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsubItems = apiClient.entities.ChecklistItem.subscribe(() => load(true), { interval: 1200 });
    const unsubProjects = apiClient.entities.Project.subscribe(() => load(true), { interval: 2500 });
    return () => {
      unsubItems();
      unsubProjects();
    };
  }, []);

  const moveTask = async (task, stage) => {
    const patch = { task_status: stage, completed: stage === "concluido" };
    await apiClient.entities.ChecklistItem.update(task.id, patch);
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, ...patch } : item)));
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const task = tasks.find((item) => item.id === result.draggableId);
    const nextStage = result.destination.droppableId;
    if (!task || taskStage(task) === nextStage) return;
    await moveTask(task, nextStage);
  };

  const grouped = useMemo(() => {
    return COLUMNS.reduce((acc, column) => {
      acc[column.key] = tasks.filter((task) => taskStage(task) === column.key);
      return acc;
    }, {});
  }, [tasks]);

  const activeCount = grouped.pendente.length + grouped.em_progresso.length;
  const overdueCount = tasks.filter((task) => isOverdue(task.due_date, task.completed)).length;

  if (loading) {
    return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-red-300" /></div>;
  }

  if (error) {
    return <div className="dz-card max-w-lg p-5 text-sm text-white/60">{error}</div>;
  }

  return (
    <div className="dz-page">
      <div className="dz-page-head">
        <div>
          <p className="dz-kicker">Foco pessoal</p>
          <h1 className="dz-page-title">Minhas tarefas</h1>
          <p className="dz-page-subtitle">Organize suas entregas e acompanhe os prazos de cada projeto.</p>
        </div>
        <div className="grid w-full max-w-sm shrink-0 grid-cols-3 divide-x divide-white/[0.07]">
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground">Ativas</p>
            <p className="mt-1 text-lg font-semibold text-white">{activeCount}</p>
          </div>
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground">Atrasos</p>
            <p className="mt-1 text-lg font-semibold text-red-300">{overdueCount}</p>
          </div>
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground">Feitas</p>
            <p className="mt-1 text-lg font-semibold text-emerald-300">{grouped.concluido.length}</p>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="dz-empty">
          <TimerReset size={22} className="text-muted-foreground" />
          <div>
            <p className="font-display text-lg font-semibold text-white/72">Nenhuma tarefa pessoal ativa</p>
            <p className="mt-1 text-sm text-muted-foreground">Quando voce for atribuido em projetos nao lancados, as tarefas aparecem aqui.</p>
          </div>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="dz-kanban-grid">
            {COLUMNS.map(({ key, label, description, Icon, tone }) => (
              <section key={key} className="dz-kanban-column dz-card min-w-0 p-3.5">
                <div className="mb-3 flex items-start justify-between gap-3 px-1">
                  <div className="flex items-center gap-2.5">
                    <span className={`grid h-9 w-6 shrink-0 place-items-center ${tone}`}>
                      <Icon size={17} />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-white">{label}</h2>
                      <p className="text-2xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <span className="dz-pill h-7">{grouped[key].length}</span>
                </div>

                <Droppable droppableId={key}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className={`dz-kanban-drop space-y-2 rounded-md transition-colors ${snapshot.isDraggingOver ? "bg-primary/[0.055] ring-1 ring-primary/25" : ""}`}>
                      {grouped[key].length === 0 ? (
                        <div className="rounded-lg border border-dashed border-white/[0.08] px-3 py-8 text-center text-sm text-muted-foreground">Arraste tarefas para esta etapa.</div>
                      ) : grouped[key].map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index} disableInteractiveElementBlocking>
                          {(dragProvided, dragSnapshot) => (
                            <TaskCard task={task} project={projects[task.project_id]} cargos={cargos} users={users} provided={dragProvided} isDragging={dragSnapshot.isDragging} />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </section>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
