import React, { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/api/appClient";
import FileField from "@/components/ui/file-field";
import { uploadFile, dueLabel, isDueSoon, isOverdue, nextProjectAction, STATUS, taskHasResponsible, taskResponsibleLabel } from "@/lib/music";
import AssignTaskDialog from "@/components/projects/AssignTaskDialog";
import { AlertTriangle, CheckCircle2, Clock3, FileAudio, FileImage, FileText, Upload, ArrowRight } from "lucide-react";

const FILE_TYPES = {
  capa: { label: "Capa", Icon: FileImage },
  audio: { label: "Áudio", Icon: FileAudio },
  documento: { label: "Documento", Icon: FileText },
  referencia: { label: "Referência", Icon: FileText },
};

const FILE_STATUS = {
  recebido: "Recebido",
  revisao: "Em revisão",
  ajuste: "Ajuste solicitado",
  aprovado: "Aprovado",
};

function projectHealth(items) {
  const open = items.filter((item) => !item.completed);
  const overdue = open.filter((item) => isOverdue(item.due_date)).length;
  const soon = open.filter((item) => isDueSoon(item.due_date)).length;
  const unassigned = open.filter((item) => !taskHasResponsible(item)).length;
  if (overdue) return { label: "Atrasado", tone: "text-red-300", Icon: AlertTriangle, detail: `${overdue} prazo(s) vencido(s)` };
  if (soon || unassigned) return { label: "Em risco", tone: "text-amber-300", Icon: Clock3, detail: soon ? `${soon} prazo(s) próximos` : `${unassigned} tarefa(s) sem responsável` };
  return { label: "Em dia", tone: "text-emerald-300", Icon: CheckCircle2, detail: "Sem bloqueios críticos" };
}

function ModuleHeader({ title, meta }) {
  return (
    <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
      <h2 className="min-w-0 break-words text-sm font-bold text-white">{title}</h2>
      {meta && <span className="shrink-0 text-2xs uppercase tracking-[0.14em] text-muted-foreground">{meta}</span>}
    </div>
  );
}

function Workflow({ sections, items }) {
  return (
    <section>
      <ModuleHeader title="Workflow" meta="Etapas" />
      <div className="overflow-hidden border-y border-white/[0.05]">
        {sections.map((section) => {
          const list = items.filter((item) => item.section_id === section.id && !item.parent_id);
          const done = list.filter((item) => item.completed).length;
          const pct = list.length ? Math.round((done / list.length) * 100) : 0;
          const overdue = list.some((item) => isOverdue(item.due_date, item.completed));
          return (
            <div key={section.id} className="grid gap-3 border-b border-white/[0.045] px-0 py-3 last:border-b-0 sm:grid-cols-[11rem_1fr_3rem] sm:items-center">
              <div>
                <p className="text-sm font-medium text-white/84">{section.name}</p>
                <p className="mt-0.5 text-2xs text-muted-foreground">{section.cargo || "Sem cargo"}</p>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div className={`h-full rounded-full ${overdue ? "bg-primary" : "bg-white/62"}`} style={{ width: `${pct}%` }} />
              </div>
              <span className={`text-xs tabular-nums ${overdue ? "text-red-300" : "text-muted-foreground"}`}>{pct}%</span>
            </div>
          );
        })}
        {sections.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma etapa criada.</p>}
      </div>
    </section>
  );
}

function Approvals({ items }) {
  const approvalItems = items
    .filter((item) => /aprovar|aprovação|revisar|validar|confirmar|capa|master|mix/i.test(item.text || ""))
    .slice(0, 6);
  return (
    <section>
      <ModuleHeader title="Aprovações" meta={`${approvalItems.filter((item) => !item.completed).length} abertas`} />
      <div className="border-y border-white/[0.05]">
        {approvalItems.map((item) => (
          <div key={item.id} className="flex items-center gap-3 border-b border-white/[0.045] py-3 last:border-b-0">
            <span className={`h-2 w-2 rounded-full ${item.completed ? "bg-emerald-400" : isOverdue(item.due_date) ? "bg-primary" : "bg-amber-300"}`} />
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm text-white/82">{item.text}</p>
              <p className="text-2xs text-muted-foreground">{taskResponsibleLabel(item) || "Sem responsável"}{item.due_date ? ` · ${dueLabel(item.due_date)}` : ""}</p>
            </div>
            <span className="text-2xs text-muted-foreground">{item.completed ? "aprovado" : "pendente"}</span>
          </div>
        ))}
        {approvalItems.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma aprovação mapeada.</p>}
      </div>
    </section>
  );
}

function Files({ project, files, onChanged }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("referencia");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim() && !file) return;
    setLoading(true);
    const file_url = file ? await uploadFile(file) : "";
    await apiClient.entities.ProjectFile.create({
      project_id: project.id,
      name: name.trim() || file?.name || "Arquivo",
      category,
      file_url,
      status: "recebido",
    });
    setName("");
    setFile(null);
    setLoading(false);
    onChanged();
  };

  return (
    <section id={`project-files-${project.id}`}>
      <ModuleHeader title="Arquivos" meta={`${files.length} itens`} />
      <div className="border-y border-white/[0.05]">
        {files.map((entry) => {
          const { Icon } = FILE_TYPES[entry.category] || FILE_TYPES.documento;
          return (
            <div key={entry.id} className="flex items-center gap-3 border-b border-white/[0.045] py-3 last:border-b-0">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-white/[0.025] text-muted-foreground"><Icon size={14} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white/82">{entry.name}</p>
                <p className="text-2xs text-muted-foreground">{FILE_TYPES[entry.category]?.label || entry.category} · {FILE_STATUS[entry.status] || entry.status}</p>
              </div>
              {entry.file_url && <a href={entry.file_url} target="_blank" rel="noreferrer" className="text-2xs text-muted-foreground hover:text-white">Abrir</a>}
            </div>
          );
        })}
        {files.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum arquivo anexado.</p>}
      </div>
      <form onSubmit={submit} className="mt-4 grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do arquivo" className="h-9 min-w-0 rounded-md border border-white/[0.05] bg-white/[0.018] px-3 text-sm outline-none placeholder:text-white/25" />
        <select aria-label="Categoria do arquivo" value={category} onChange={(event) => setCategory(event.target.value)} className="h-9 min-w-0 rounded-md border border-white/[0.05] bg-background px-3 text-sm text-white/70 outline-none">
          {Object.entries(FILE_TYPES).map(([key, type]) => <option key={key} value={key}>{type.label}</option>)}
        </select>
        <div className="sm:col-span-2"><FileField value={file} onChange={setFile} hint="Arquivo, link ou referência do projeto" /></div>
        <button disabled={loading} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-white/[0.05] px-3 text-sm font-bold text-white/78 hover:bg-white/[0.08] sm:col-span-2">
          <Upload size={14} /> {loading ? "Enviando..." : "Adicionar arquivo"}
        </button>
      </form>
    </section>
  );
}

export default function ProjectWorkspace({ project, artist, sections, items, files, onChanged, onOpenTasks, onOpenProject, onEditArtist }) {
  const [assignTask, setAssignTask] = useState(null);
  const [ownerUser, setOwnerUser] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerError, setOwnerError] = useState(false);
  useEffect(() => {
    let active = true;
    setOwnerUser(null);
    setOwnerError(false);
    setOwnerLoading(!!artist?.user_id);
    if (artist?.user_id) apiClient.entities.User.get(artist.user_id)
      .then(user => { if (active) setOwnerUser(user); })
      .catch(() => { if (active) setOwnerError(true); })
      .finally(() => { if (active) setOwnerLoading(false); });
    return () => { active = false; };
  }, [artist?.user_id]);
  const health = useMemo(() => projectHealth(items), [items]);
  const nextAction = useMemo(() => nextProjectAction(project, items, files), [project, items, files]);
  const open = items.filter((item) => !item.completed);
  const HealthIcon = health.Icon;
  const act = () => {
    if (nextAction.target === "assign") setAssignTask(items.find(item => item.id === nextAction.task_id));
    else if (nextAction.target === "task") onOpenTasks?.(nextAction.task_id);
    else if (nextAction.target === "files") {
      const section = document.getElementById(`project-files-${project.id}`);
      section?.scrollIntoView({ block: "center", behavior: "smooth" });
      section?.querySelector("input")?.focus({ preventScroll: true });
    } else onOpenProject?.();
  };

  return (
    <div className="dz-workspace-grid min-w-0">
      <div className="min-w-0 space-y-7">
        <section className="border-b border-white/[0.05] pb-5">
          <p className="text-2xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Próxima ação</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="break-words text-xl font-bold text-white">{nextAction.title}</h2>
              <p className="mt-1 break-words text-sm text-white/62">{nextAction.text}</p>
              <p className={`mt-2 text-xs ${nextAction.tone === "danger" ? "text-red-300" : nextAction.tone === "warn" ? "text-amber-300" : "text-muted-foreground"}`}>{nextAction.detail}</p>
            </div>
            <button type="button" onClick={act} className="inline-flex min-h-9 shrink-0 items-center gap-2 self-start rounded-md bg-white/[0.055] px-3 py-2 text-sm font-bold text-white/78 hover:bg-white/[0.085]">
              {nextAction.action} <ArrowRight size={14} />
            </button>
          </div>
        </section>
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] pb-3">
            <p className="text-sm font-bold text-white">Status do projeto</p>
            <div className={`flex items-center gap-2 text-sm font-bold ${health.tone}`}><HealthIcon size={15} />{health.label}</div>
          </div>
          <div className="dz-workspace-stats border-b border-white/[0.05] py-4">
            <div className="min-w-0" data-project-owner>
              <p className="text-2xs text-muted-foreground">Dono do projeto</p>
              <p className="mt-1 break-words text-sm text-white/76">{artist?.name || project.main_artist_name || "Selecione um artista"}</p>
              <p className="mt-1 break-words text-xs text-muted-foreground">{ownerLoading ? "Carregando conta..." : ownerUser ? `${ownerUser.full_name || ownerUser.email}${ownerUser.full_name ? ` · ${ownerUser.email}` : ""}` : ownerError ? "Usuário indisponível" : "Sem usuário vinculado"}</p>
              {artist && <button type="button" onClick={onEditArtist} className="mt-2 text-xs font-medium text-red-200 hover:text-white">{artist.user_id ? "Editar vínculo" : "Vincular usuário"}</button>}
            </div>
            <div><p className="text-2xs text-muted-foreground">Status</p><p className="mt-1 text-sm text-white/76">{STATUS[project.status] || project.status}</p></div>
            <div><p className="text-2xs text-muted-foreground">Lançamento</p><p className="mt-1 text-sm text-white/76">{project.release_date ? new Date(project.release_date).toLocaleDateString("pt-BR") : "Sem data"}</p></div>
            <div><p className="text-2xs text-muted-foreground">Tarefas abertas</p><p className="mt-1 text-sm text-white/76">{open.length}</p></div>
            <div><p className="text-2xs text-muted-foreground">Sem responsável</p><p className="mt-1 text-sm text-white/76">{open.filter((item) => !taskHasResponsible(item)).length}</p></div>
          </div>
        </section>
        <Workflow sections={sections} items={items} />
      </div>
      {assignTask && <AssignTaskDialog task={assignTask} project={project} onClose={() => setAssignTask(null)} onSaved={onChanged} />}
      <div className="dz-workspace-aside min-w-0 space-y-7">
        <Approvals items={items} />
        <Files project={project} files={files} onChanged={onChanged} />
      </div>
    </div>
  );
}
