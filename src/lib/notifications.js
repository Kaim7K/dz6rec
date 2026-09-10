import { apiClient } from "@/api/appClient";
import { usersForCargo } from "@/lib/music";

// Envia uma notificação para uma lista de ids de usuários (deduplicada, sem o autor)
export async function notifyUsers(userIds, { text, projectId, link }, excludeId = null) {
  const ids = [...new Set((userIds || []).filter(Boolean).filter((id) => id !== excludeId))];
  if (!ids.length) return;
  await apiClient.entities.Notification.bulkCreate(ids.map((user_id) => ({ user_id, text, project_id: projectId, link })));
}

// Extrai menções @Nome de um texto — resolve pessoas (por nome, @handle ou e-mail) e cargos (todos do cargo)
export function parseMentions(text, users = [], cargos = []) {
  const out = { users: [], tokens: [] };
  const lower = (text || "").toLowerCase();
  if (!lower.includes("@")) return out;

  const candidates = [];
  for (const u of users) {
    for (const label of [u.full_name, u.handle, u.email]) {
      if (label) candidates.push({ label: String(label), user: u });
    }
  }
  for (const c of cargos) if (c?.name) candidates.push({ label: c.name, cargo: c.name });
  candidates.sort((a, b) => b.label.length - a.label.length);

  const seenIds = new Set();
  const seenTokens = new Set();
  const taken = [];
  const addPerson = (u) => {
    if (u?.id && !seenIds.has(u.id)) { seenIds.add(u.id); out.users.push(u); }
  };

  for (const cand of candidates) {
    const token = "@" + cand.label;
    const tl = token.toLowerCase();
    let idx = lower.indexOf(tl);
    while (idx !== -1) {
      const end = idx + token.length;
      const nextOk = end === lower.length || !/[a-z0-9à-ÿ]/.test(lower[end]);
      const free = !taken.some(([a, b]) => idx < b && end > a);
      if (nextOk && free) {
        taken.push([idx, end]);
        if (cand.user) addPerson(cand.user);
        else usersForCargo(users, cand.cargo).forEach(addPerson);
        if (!seenTokens.has(token)) { seenTokens.add(token); out.tokens.push(token); }
      }
      idx = lower.indexOf(tl, idx + 1);
    }
  }
  return out;
}

// Quando todos os itens de uma seção ficam concluídos, notifica os responsáveis da próxima seção
export async function notifyNextStage({ project, sectionId, toggledItemId, items, sections, users, excludeUserId }) {
  try {
    const sectionItems = items.filter((i) => i.section_id === sectionId && !i.parent_id);
    if (!sectionItems.length) return;
    if (!sectionItems.every((i) => i.completed || i.id === toggledItemId)) return;

    const sorted = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));
    const done = sorted.find((s) => s.id === sectionId);
    if (!done) return;

    const sectionComplete = (s) => {
      const its = items.filter((i) => i.section_id === s.id && !i.parent_id);
      return its.length > 0 && its.every((i) => i.completed);
    };
    const next = sorted.find((s) => (s.order || 0) > (done.order || 0) && !sectionComplete(s));
    if (!next) return;

    const ids = [...(next.responsible_ids || [])];
    usersForCargo(users, next.cargo).forEach((u) => ids.push(u.id));
    await notifyUsers(ids, {
      text: `Etapa "${done.name}" concluída em "${project.name}" — "${next.name}" é a próxima.`,
      projectId: project.id,
      link: `/projetos/${project.id}`,
    }, excludeUserId);
  } catch {}
}