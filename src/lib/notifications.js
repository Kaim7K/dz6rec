import { apiClient } from "@/api/appClient";
import { usersForCargo } from "@/lib/music";

export async function notifyUsers(userIds, { text, projectId, link }, excludeId = null) {
  const ids = [...new Set((userIds || []).filter(Boolean).filter((id) => id !== excludeId))];
  if (!ids.length) return;
  await apiClient.entities.Notification.bulkCreate(ids.map((user_id) => ({ user_id, text, project_id: projectId, link, read: false })));
}

export function parseMentions(text, users = [], cargos = []) {
  const out = { users: [], tokens: [] };
  const lower = (text || "").toLowerCase();
  if (!lower.includes("@")) return out;

  const candidates = [];
  for (const user of users) {
    for (const label of [user.full_name, user.handle, user.email]) {
      if (label) candidates.push({ label: String(label), user });
    }
  }
  for (const cargo of cargos) {
    if (cargo?.name) candidates.push({ label: cargo.name, cargo: cargo.name });
  }
  candidates.sort((a, b) => b.label.length - a.label.length);

  const seenIds = new Set();
  const seenTokens = new Set();
  const taken = [];
  const addPerson = (user) => {
    if (user?.id && !seenIds.has(user.id)) {
      seenIds.add(user.id);
      out.users.push(user);
    }
  };

  for (const candidate of candidates) {
    const token = `@${candidate.label}`;
    const tokenLower = token.toLowerCase();
    let index = lower.indexOf(tokenLower);
    while (index !== -1) {
      const end = index + token.length;
      const nextOk = end === lower.length || !/[\p{L}\p{N}_-]/u.test(lower[end]);
      const free = !taken.some(([start, finish]) => index < finish && end > start);
      if (nextOk && free) {
        taken.push([index, end]);
        if (candidate.user) addPerson(candidate.user);
        else usersForCargo(users, candidate.cargo).forEach(addPerson);
        if (!seenTokens.has(token)) {
          seenTokens.add(token);
          out.tokens.push(token);
        }
      }
      index = lower.indexOf(tokenLower, index + 1);
    }
  }
  return out;
}

export async function notifyNextStage({ project, sectionId, toggledItemId, items, sections, users, excludeUserId }) {
  try {
    const sectionItems = items.filter((item) => item.section_id === sectionId && !item.parent_id);
    if (!sectionItems.length) return;
    if (!sectionItems.every((item) => item.completed || item.id === toggledItemId)) return;

    const sorted = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));
    const done = sorted.find((section) => section.id === sectionId);
    if (!done) return;

    const sectionComplete = (section) => {
      const sectionTasks = items.filter((item) => item.section_id === section.id && !item.parent_id);
      return sectionTasks.length > 0 && sectionTasks.every((item) => item.completed);
    };
    const next = sorted.find((section) => (section.order || 0) > (done.order || 0) && !sectionComplete(section));
    if (!next) return;

    const ids = [...(next.responsible_ids || [])];
    usersForCargo(users, next.cargo).forEach((user) => ids.push(user.id));
    await notifyUsers(ids, {
      text: `Etapa "${done.name}" concluida em "${project.name}" - "${next.name}" e a proxima.`,
      projectId: project.id,
      link: `/projetos/${project.id}`,
    }, excludeUserId);
  } catch {}
}
