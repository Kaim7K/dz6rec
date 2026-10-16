import { apiClient } from "@/api/appClient";

export const TYPE = { single: "Single", ep: "EP", album: "Álbum" };
export const PERMISSAO = { superadmin: "Superadmin", admin: "Admin", membro: "Membro" };

export const STATUS = {
  rascunho: "Rascunho",
  planejamento: "Planejamento",
  producao: "Em produção",
  revisao: "Em revisão",
  pre_lancamento: "Pré-lançamento",
  agendado: "Agendado",
  lancado: "Lançado",
  pausado: "Pausado",
  cancelado: "Cancelado",
  arquivado: "Arquivado",
};
export const STATUS_ORDER = ["rascunho", "planejamento", "producao", "revisao", "pre_lancamento", "agendado", "lancado", "pausado", "cancelado", "arquivado"];

export const PRIORITY = {
  baixa: { label: "Baixa", tone: "text-slate-300", dot: "bg-slate-400" },
  normal: { label: "Normal", tone: "text-blue-300", dot: "bg-blue-400" },
  alta: { label: "Alta", tone: "text-amber-300", dot: "bg-amber-400" },
  urgente: { label: "Urgente", tone: "text-red-300", dot: "bg-primary" },
};

export const PRIORITY_ORDER = ["baixa", "normal", "alta", "urgente"];
export const PRIORITY_WEIGHT = { urgente: 4, alta: 3, normal: 2, baixa: 1 };

export const STATUS_TONE = {
  rascunho:        { dot: "bg-white/40",    text: "text-white/55",   bg: "bg-white/[0.05]",   border: "border-white/[0.07]" },
  planejamento:    { dot: "bg-blue-400", text: "text-blue-300", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  producao:        { dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  revisao:         { dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
  pre_lancamento:  { dot: "bg-purple-400", text: "text-purple-300", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  agendado:        { dot: "bg-sky-400", text: "text-sky-300", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  lancado:         { dot: "bg-green-400", text: "text-green-300", bg: "bg-green-500/10", border: "border-green-500/20" },
  pausado:         { dot: "bg-orange-400", text: "text-orange-300", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  cancelado:       { dot: "bg-red-400",     text: "text-red-300",     bg: "bg-red-500/10",     border: "border-red-500/20" },
  arquivado:       { dot: "bg-white/25",    text: "text-white/35",    bg: "bg-white/[0.03]",   border: "border-white/[0.06]" },
};

export const statusBadge = (status) => {
  const t = STATUS_TONE[status] || STATUS_TONE.rascunho;
  return `${t.bg} ${t.text} ${t.border}`;
};

export function isOverdue(date, done = false) {
  if (!date || done) return false;
  const due = new Date(date);
  due.setHours(23, 59, 59, 999);
  return due < new Date();
}

export function isDueSoon(date, done = false, days = 3) {
  if (!date || done || isOverdue(date, done)) return false;
  const due = new Date(date);
  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  return due <= limit;
}

export function dueLabel(date) {
  if (!date) return "";
  const today = new Date();
  const due = new Date(date);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  if (diff < 0) return `${Math.abs(diff)} dias atrás`;
  if (diff <= 7) return `${diff} dias`;
  return due.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function taskScore(task) {
  const priority = PRIORITY_WEIGHT[task.priority || "normal"] || 2;
  const due = task.due_date ? new Date(task.due_date).getTime() : Number.MAX_SAFE_INTEGER;
  return (5 - priority) * 10000000000000 + due;
}

export function nextProjectAction(project, items = [], files = [], reviews = []) {
  const open = items.filter((item) => !item.completed);
  const overdue = open.filter((item) => isOverdue(item.due_date)).sort((a, b) => taskScore(a) - taskScore(b));
  if (overdue.length) {
    return {
      tone: "danger",
      title: "Resolver atraso",
      text: overdue[0].text,
      detail: overdue[0].due_date ? `Venceu ${dueLabel(overdue[0].due_date).toLowerCase()}` : "Prazo vencido",
      href: `/projetos/${project.id}`,
      action: "Abrir tarefa",
      target: "task",
      task_id: overdue[0].id,
    };
  }

  const review = reviews.find(entry => entry.artifact.review_status === "revisao");
  if (review) return { tone: "warn", title: "Revisar arquivo", text: review.artifact.name, detail: `Revisor: ${review.artifact.reviewer_name || "Não definido"}`, action: "Abrir revisão", target: "review", review };
  const unassigned = open.find((item) => !taskHasResponsible(item));
  if (unassigned) {
    return {
      tone: "warn",
      title: "Definir responsável",
      text: unassigned.text,
      detail: "Tarefa sem responsável",
      href: `/projetos/${project.id}`,
      action: "Atribuir",
      target: "assign",
      task_id: unassigned.id,
    };
  }

  const approval = open.find((item) => /aprovar|aprovação|revisar|validar|confirmar|capa|master|mix/i.test(item.text || ""));
  if (approval) {
    return {
      tone: "warn",
      title: "Aguardando aprovação",
      text: approval.text,
      detail: approval.responsible_name || approval.cargo || "Pendente",
      href: `/projetos/${project.id}`,
      action: "Revisar",
      target: "task",
      task_id: approval.id,
    };
  }

  if (!files.length) {
    return {
      tone: "neutral",
      title: "Adicionar materiais",
      text: "Envie capa, áudio ou referência para centralizar o projeto.",
      detail: "Nenhum arquivo anexado",
      href: `/projetos/${project.id}`,
      action: "Adicionar arquivo",
      target: "files",
    };
  }

  const nextTask = open.sort((a, b) => taskScore(a) - taskScore(b))[0];
  if (nextTask) {
    return {
      tone: "neutral",
      title: "Continuar tarefa",
      text: nextTask.text,
      detail: nextTask.due_date ? dueLabel(nextTask.due_date) : nextTask.responsible_name || "Sem prazo",
      href: `/projetos/${project.id}`,
      action: "Continuar",
      target: "task",
      task_id: nextTask.id,
    };
  }

  return {
    tone: "good",
    title: "Projeto em dia",
    text: "Nenhuma pendência aberta neste projeto.",
    detail: STATUS[project.status] || project.status,
    href: `/projetos/${project.id}`,
    action: "Ver projeto",
    target: "project",
  };
}

// Cargos padrão (semeados dinamicamente; novos cargos podem ser adicionados em Configurações)
export const CARGOS = [
  "Artista/Intérprete", "Produtor Musical", "Beatmaker", "Engenheiro de Áudio", "Designer",
  "Diretor Artístico", "Social Media", "Estrategista de Marketing", "Diretor de Marketing", "COO", "CEO",
];

export const CATEGORIES = [
  { key: "musica",    label: "Música",    color: "#dc0000" },
  { key: "visual",    label: "Visual",    color: "#f5f5f5" },
  { key: "marketing", label: "Marketing", color: "#8f0d12" },
];

// Template padrão — 3 seções (Música, Visual, Marketing) com cargo padrão e tarefas genéricas
export const DEFAULT_TEMPLATE_NAME = "Padrão · Música · Visual · Marketing";
export const DEFAULT_TEMPLATE = {
  name: DEFAULT_TEMPLATE_NAME,
  sections: [
    { name: "Música", category: "musica", cargo: "Produtor Musical", tasks: [
      "Definição do conceito do projeto",
      "Alinhamento da identidade artística e do objetivo do lançamento",
      "Organização do cronograma geral",
      "Criação do beat",
      "Ajustes finais do instrumental",
      "Gravação das vozes",
      "Mixagem",
      "Masterização",
    ] },
    { name: "Visual", category: "visual", cargo: "Designer", tasks: [
      "Criação do conceito visual",
      "Desenvolvimento da capa do projeto",
      "Definição da identidade visual",
      "Produção de artes para Reels e Stories",
      "Produção de carrossel para o feed",
    ] },
    { name: "Marketing", category: "marketing", cargo: "Estrategista de Marketing", tasks: [
      "Definição da data de lançamento",
      "Criação da estratégia de Pré-Save",
      "Planejamento de conteúdos para Reels e TikTok",
      "Planejamento de Stories promocionais",
      "Publicação do Pré-Save",
      "Início da divulgação orgânica",
      "Início do tráfego pago",
      "Monitoramento do engajamento",
      "Publicação oficial nas plataformas",
      "Postagem principal de lançamento",
      "Publicação de Reels e TikToks",
      "Stories com link direto",
      "Monitoramento dos resultados",
      "Análise de streams e alcance",
      "Reaproveitamento de conteúdos",
      "Planejamento da continuidade da divulgação",
      "Registro dos resultados finais",
    ] },
  ],
};

// normaliza cargo (string ou array) em array
export const cargoList = (c) => (!c ? [] : Array.isArray(c) ? c.filter(Boolean) : [c]);

// usuários cujo array de cargos inclui o cargo informado
export function usersForCargo(users, cargoName) {
  if (!cargoName) return [];
  return users.filter((u) => cargoList(u.cargo).includes(cargoName));
}

export function taskResponsibleIds(task = {}) {
  return [...new Set([...(Array.isArray(task.responsible_ids) ? task.responsible_ids : []), task.responsible_id].filter(Boolean))].slice(0, 2);
}

export function taskResponsibleNames(task = {}) {
  return [...new Set([...(Array.isArray(task.responsible_names) ? task.responsible_names : []), task.responsible_name].filter(Boolean))].slice(0, 2);
}

export function taskHasResponsible(task = {}) {
  return taskResponsibleIds(task).length > 0 || taskResponsibleNames(task).length > 0;
}

export function taskResponsibleLabel(task = {}) {
  const names = taskResponsibleNames(task);
  if (names.length) return names.join(", ");
  return task.cargo || "";
}

export async function uploadFile(file, options = {}) {
  const { file_url } = await apiClient.integrations.Core.UploadFile({ file, onProgress: options.onProgress });
  return file_url;
}

export async function logActivity(projectId, text, userName) {
  try { await apiClient.entities.ActivityLog.create({ project_id: projectId, text, user_name: userName || "Equipe" }); } catch {}
}

// Aplica um template salvo a um projeto, com atribuição automática de responsáveis por cargo
export async function applyTemplate(projectId, templateId, users = []) {
  const sections = await apiClient.entities.ChecklistSection.filter({ template_id: templateId });
  for (const s of sections.sort((a, b) => (a.order || 0) - (b.order || 0))) {
    const match = usersForCargo(users, s.cargo);
    const ns = await apiClient.entities.ChecklistSection.create({
      project_id: projectId, name: s.name, cargo: s.cargo, category: s.category,
      responsible_ids: match.map((u) => u.id), responsible_names: match.map((u) => u.full_name || u.email),
      order: s.order,
    });
    const items = await apiClient.entities.ChecklistItem.filter({ section_id: s.id });
    const idMap = {};
    for (const it of items.filter((i) => !i.parent_id)) {
      const ni = await apiClient.entities.ChecklistItem.create({ section_id: ns.id, project_id: projectId, text: it.text, completed: false, parent_id: null, order: it.order, cargo: it.cargo, priority: it.priority || "normal", detail_mode: it.detail_mode || "subtasks", observation: it.observation || "" });
      idMap[it.id] = ni.id;
    }
    for (const it of items.filter((i) => i.parent_id)) {
      if (idMap[it.parent_id]) await apiClient.entities.ChecklistItem.create({ section_id: ns.id, project_id: projectId, text: it.text, completed: false, parent_id: idMap[it.parent_id], order: it.order, cargo: it.cargo, priority: it.priority || "normal", detail_mode: it.detail_mode || "subtasks", observation: it.observation || "" });
    }
  }
}

// Aplica o template padrão (built-in) a um projeto
export async function applyDefaultTemplate(projectId, users = []) {
  for (let si = 0; si < DEFAULT_TEMPLATE.sections.length; si++) {
    const s = DEFAULT_TEMPLATE.sections[si];
    const match = usersForCargo(users, s.cargo);
    const ns = await apiClient.entities.ChecklistSection.create({
      project_id: projectId, name: s.name, cargo: s.cargo, category: s.category,
      responsible_ids: match.map((u) => u.id), responsible_names: match.map((u) => u.full_name || u.email),
      order: si,
    });
    for (let ti = 0; ti < s.tasks.length; ti++) {
      await apiClient.entities.ChecklistItem.create({ section_id: ns.id, project_id: projectId, text: s.tasks[ti], completed: false, parent_id: null, order: ti, detail_mode: "subtasks", observation: "" });
    }
  }
}
