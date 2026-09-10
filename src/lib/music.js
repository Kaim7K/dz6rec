import { apiClient } from "@/api/appClient";

export const TYPE = { single: "Single", ep: "EP", album: "Ãlbum" };
export const PERMISSAO = { superadmin: "Superadmin", admin: "Admin", membro: "Membro" };

export const STATUS = {
  rascunho: "Rascunho",
  planejamento: "Planejamento",
  producao: "Em produÃ§Ã£o",
  revisao: "Em revisÃ£o",
  pre_lancamento: "PrÃ©-lanÃ§amento",
  agendado: "Agendado",
  lancado: "LanÃ§ado",
  pausado: "Pausado",
  cancelado: "Cancelado",
  arquivado: "Arquivado",
};
export const STATUS_ORDER = ["rascunho", "planejamento", "producao", "revisao", "pre_lancamento", "agendado", "lancado", "pausado", "cancelado", "arquivado"];

export const STATUS_TONE = {
  rascunho:        { dot: "bg-white/40",    text: "text-white/55",   bg: "bg-white/[0.05]",   border: "border-white/[0.07]" },
  planejamento:    { dot: "bg-violet-400",  text: "text-violet-300", bg: "bg-violet-500/10",  border: "border-violet-500/20" },
  producao:        { dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  revisao:         { dot: "bg-sky-400",     text: "text-sky-300",     bg: "bg-sky-500/10",     border: "border-sky-500/20" },
  pre_lancamento:  { dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
  agendado:        { dot: "bg-indigo-400",  text: "text-indigo-300", bg: "bg-indigo-500/10",  border: "border-indigo-500/20" },
  lancado:         { dot: "bg-primary",     text: "text-primary",     bg: "bg-primary/10",     border: "border-primary/25" },
  pausado:         { dot: "bg-white/30",    text: "text-white/45",    bg: "bg-white/[0.04]",   border: "border-white/[0.06]" },
  cancelado:       { dot: "bg-red-400",     text: "text-red-300",     bg: "bg-red-500/10",     border: "border-red-500/20" },
  arquivado:       { dot: "bg-white/25",    text: "text-white/35",    bg: "bg-white/[0.03]",   border: "border-white/[0.06]" },
};

export const statusBadge = (status) => {
  const t = STATUS_TONE[status] || STATUS_TONE.rascunho;
  return `${t.bg} ${t.text} ${t.border}`;
};

// Cargos padrÃ£o (semeados dinamicamente; novos cargos podem ser adicionados em ConfiguraÃ§Ãµes)
export const CARGOS = [
  "Artista/IntÃ©rprete", "Produtor Musical", "Beatmaker", "Engenheiro de Ãudio", "Designer",
  "Diretor ArtÃ­stico", "Social Media", "Estrategista de Marketing", "Diretor de Marketing", "COO", "CEO",
];

export const CATEGORIES = [
  { key: "musica",    label: "MÃºsica",    color: "#10b981" },
  { key: "visual",    label: "Visual",    color: "#7c3aed" },
  { key: "marketing", label: "Marketing", color: "#f59e0b" },
];

// Template padrÃ£o â€” 3 seÃ§Ãµes (MÃºsica, Visual, Marketing) com cargo padrÃ£o e tarefas genÃ©ricas
export const DEFAULT_TEMPLATE_NAME = "PadrÃ£o Â· MÃºsica Â· Visual Â· Marketing";
export const DEFAULT_TEMPLATE = {
  name: DEFAULT_TEMPLATE_NAME,
  sections: [
    { name: "MÃºsica", category: "musica", cargo: "Produtor Musical", tasks: [
      "DefiniÃ§Ã£o do conceito do projeto",
      "Alinhamento da identidade artÃ­stica e do objetivo do lanÃ§amento",
      "OrganizaÃ§Ã£o do cronograma geral",
      "CriaÃ§Ã£o do beat",
      "Ajustes finais do instrumental",
      "GravaÃ§Ã£o das vozes",
      "Mixagem",
      "MasterizaÃ§Ã£o",
    ] },
    { name: "Visual", category: "visual", cargo: "Designer", tasks: [
      "CriaÃ§Ã£o do conceito visual",
      "Desenvolvimento da capa do projeto",
      "DefiniÃ§Ã£o da identidade visual",
      "ProduÃ§Ã£o de artes para Reels e Stories",
      "ProduÃ§Ã£o de carrossel para o feed",
    ] },
    { name: "Marketing", category: "marketing", cargo: "Estrategista de Marketing", tasks: [
      "DefiniÃ§Ã£o da data de lanÃ§amento",
      "CriaÃ§Ã£o da estratÃ©gia de PrÃ©-Save",
      "Planejamento de conteÃºdos para Reels e TikTok",
      "Planejamento de Stories promocionais",
      "PublicaÃ§Ã£o do PrÃ©-Save",
      "InÃ­cio da divulgaÃ§Ã£o orgÃ¢nica",
      "InÃ­cio do trÃ¡fego pago",
      "Monitoramento do engajamento",
      "PublicaÃ§Ã£o oficial nas plataformas",
      "Postagem principal de lanÃ§amento",
      "PublicaÃ§Ã£o de Reels e TikToks",
      "Stories com link direto",
      "Monitoramento dos resultados",
      "AnÃ¡lise de streams e alcance",
      "Reaproveitamento de conteÃºdos",
      "Planejamento da continuidade da divulgaÃ§Ã£o",
      "Registro dos resultados finais",
    ] },
  ],
};

// normaliza cargo (string ou array) em array
export const cargoList = (c) => (!c ? [] : Array.isArray(c) ? c.filter(Boolean) : [c]);

// usuÃ¡rios cujo array de cargos inclui o cargo informado
export function usersForCargo(users, cargoName) {
  if (!cargoName) return [];
  return users.filter((u) => cargoList(u.cargo).includes(cargoName));
}

export async function uploadFile(file) {
  const { file_url } = await apiClient.integrations.Core.UploadFile({ file });
  return file_url;
}

export async function logActivity(projectId, text, userName) {
  try { await apiClient.entities.ActivityLog.create({ project_id: projectId, text, user_name: userName || "Equipe" }); } catch {}
}

// Aplica um template salvo a um projeto, com atribuiÃ§Ã£o automÃ¡tica de responsÃ¡veis por cargo
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
      const ni = await apiClient.entities.ChecklistItem.create({ section_id: ns.id, project_id: projectId, text: it.text, completed: false, parent_id: null, order: it.order, cargo: it.cargo });
      idMap[it.id] = ni.id;
    }
    for (const it of items.filter((i) => i.parent_id)) {
      if (idMap[it.parent_id]) await apiClient.entities.ChecklistItem.create({ section_id: ns.id, project_id: projectId, text: it.text, completed: false, parent_id: idMap[it.parent_id], order: it.order, cargo: it.cargo });
    }
  }
}

// Aplica o template padrÃ£o (built-in) a um projeto
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
      await apiClient.entities.ChecklistItem.create({ section_id: ns.id, project_id: projectId, text: s.tasks[ti], completed: false, parent_id: null, order: ti });
    }
  }
}