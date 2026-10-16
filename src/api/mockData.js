import { prepareReview, protectedReviewPatch } from "../lib/reviews.js";

const STORE_KEY = "dz6_mock_store_v1";
const PROFILE_KEY = "dz6_mock_profile_id";

export function isLocalMockEnabled() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

const now = new Date().toISOString();
const daysFromNow = (days) => new Date(Date.now() + 1000 * 60 * 60 * 24 * days).toISOString().slice(0, 10);

const cargos = [
  { id: "cargo-ceo", name: "CEO", color: "#ef4444", created_date: now },
  { id: "cargo-coo", name: "COO", color: "#f59e0b", created_date: now },
  { id: "cargo-produtor", name: "Produtor Musical", color: "#dc0000", created_date: now },
  { id: "cargo-designer", name: "Designer", color: "#f5f5f5", created_date: now },
  { id: "cargo-marketing", name: "Estrategista de Marketing", color: "#f97316", created_date: now },
  { id: "cargo-social", name: "Social Media", color: "#737373", created_date: now },
  { id: "cargo-artista", name: "Artista/Intérprete", color: "#b91c1c", created_date: now },
];

const users = [
  { id: "user-admin", full_name: "Admin DZ6", email: "admin@dz6.local", role: "admin", permissao: "superadmin", cargo: ["CEO", "COO"], status: "ativo", handle: "admin" },
  { id: "user-produtor", full_name: "Pedro Produtor", email: "produtor@dz6.local", role: "user", permissao: "membro", cargo: ["Produtor Musical"], status: "ativo", handle: "produtor" },
  { id: "user-designer", full_name: "Duda Designer", email: "designer@dz6.local", role: "user", permissao: "membro", cargo: ["Designer"], status: "ativo", handle: "designer" },
  { id: "user-marketing", full_name: "Mari Marketing", email: "marketing@dz6.local", role: "user", permissao: "admin", cargo: ["Estrategista de Marketing", "Social Media"], status: "ativo", handle: "marketing" },
  { id: "user-artista", full_name: "Artista Demo", email: "artista@dz6.local", role: "user", permissao: "membro", cargo: ["Artista/Intérprete"], status: "ativo", handle: "artista" },
];

const artists = [
  { id: "artist-1", name: "Artista Demo", handle: "artista", bio: "Perfil de teste para revisar fluxos do painel.", photo_url: "", created_date: now },
  { id: "artist-2", name: "MC Exemplo", handle: "mcexemplo", bio: "Outro artista para popular o catálogo local.", photo_url: "", created_date: now },
];

const projects = [
  {
    id: "project-1",
    name: "Single Piloto",
    type: "single",
    status: "producao",
    main_artist_id: "artist-1",
    main_artist_name: "Artista Demo",
    featuring: "",
    release_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
    description: "Projeto local para validar cargos, tarefas e checklist.",
    created_date: now,
  },
  {
    id: "project-2",
    name: "EP Laboratório",
    type: "ep",
    status: "planejamento",
    main_artist_id: "artist-2",
    main_artist_name: "MC Exemplo",
    featuring: "Artista Demo",
    release_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
    description: "Segundo projeto de teste com mais tarefas pendentes.",
    created_date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const sections = [
  { id: "section-musica", project_id: "project-1", name: "Música", cargo: "Produtor Musical", category: "musica", order: 0, created_date: now },
  { id: "section-visual", project_id: "project-1", name: "Visual", cargo: "Designer", category: "visual", order: 1, created_date: now },
  { id: "section-marketing", project_id: "project-1", name: "Marketing", cargo: "Estrategista de Marketing", category: "marketing", order: 2, created_date: now },
  { id: "section-ep", project_id: "project-2", name: "Planejamento", cargo: "COO", category: "marketing", order: 0, created_date: now },
];

const items = [
  { id: "item-1", project_id: "project-1", section_id: "section-musica", text: "Finalizar arranjo do beat", completed: false, order: 0, cargo: "Produtor Musical", responsible_id: "user-produtor", responsible_name: "Pedro Produtor", priority: "urgente", due_date: daysFromNow(0), created_date: now },
  { id: "item-2", project_id: "project-1", section_id: "section-musica", text: "Revisar gravação das vozes", completed: true, order: 1, cargo: "Produtor Musical", responsible_id: "user-produtor", responsible_name: "Pedro Produtor", priority: "normal", due_date: daysFromNow(-1), created_date: now },
  { id: "item-3", project_id: "project-1", section_id: "section-visual", text: "Criar capa do single", completed: false, order: 0, cargo: "Designer", responsible_id: "user-designer", responsible_name: "Duda Designer", priority: "alta", due_date: daysFromNow(2), created_date: now },
  { id: "item-4", project_id: "project-1", section_id: "section-marketing", text: "Planejar campanha de pré-save", completed: false, order: 0, cargo: "Estrategista de Marketing", responsible_id: "user-marketing", responsible_name: "Mari Marketing", priority: "alta", due_date: daysFromNow(4), created_date: now },
  { id: "item-5", project_id: "project-2", section_id: "section-ep", text: "Definir cronograma do EP", completed: false, order: 0, cargo: "COO", responsible_id: "user-admin", responsible_name: "Admin DZ6", priority: "normal", due_date: daysFromNow(5), created_date: now },
  { id: "item-6", project_id: "project-2", section_id: "section-ep", text: "Confirmar participações", completed: false, order: 1, cargo: "Artista/Intérprete", responsible_id: "user-artista", responsible_name: "Artista Demo", priority: "baixa", due_date: daysFromNow(8), created_date: now },
];

const seed = {
  ActivityLog: [
    { id: "log-1", project_id: "project-1", text: "Ambiente local iniciado", user_name: "Admin DZ6", created_date: now },
  ],
  Artist: artists,
  Cargo: cargos,
  ChecklistItem: items,
  ChecklistNote: [],
  ChecklistSection: sections,
  ChecklistTemplate: [
    { id: "template-1", name: "Lançamento completo", project_type: "single", created_date: now },
  ],
  Notification: [
    { id: "notif-1", user_id: "user-produtor", text: "Você tem uma tarefa de produção pendente.", read: false, link: "/minhas-tarefas", created_date: now },
    { id: "notif-2", user_id: "user-designer", text: "A capa do single aguarda criação.", read: false, link: "/minhas-tarefas", created_date: now },
  ],
  Project: projects,
  ProjectFile: [
    { id: "file-1", project_id: "project-1", name: "Referência visual", category: "referencia", file_url: "", status: "aprovado", created_date: now },
    { id: "file-2", project_id: "project-1", name: "Capa em revisão", category: "capa", file_url: "", status: "ajuste", created_date: now },
  ],
  ProjectMessage: [
    { id: "msg-1", project_id: "project-1", text: "Esse chat também funciona no simulador local.", user_id: "user-admin", user_name: "Admin DZ6", created_date: now },
  ],
  SystemFlag: [],
  Track: [
    { id: "track-1", project_id: "project-1", name: "Single Piloto", track_number: 1, main_artist_name: "Artista Demo", version_label: "Demo 01", created_date: now },
  ],
  TrackVersion: [],
  User: users,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getMockStore() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) {
    localStorage.setItem(STORE_KEY, JSON.stringify(seed));
    return clone(seed);
  }
  return JSON.parse(raw);
}

function saveMockStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function resetMockStore() {
  localStorage.setItem(STORE_KEY, JSON.stringify(seed));
}

export function getMockProfiles() {
  return getMockStore().User || users;
}

export function getMockProfileId() {
  return localStorage.getItem(PROFILE_KEY) || "user-admin";
}

export function setMockProfileId(id) {
  localStorage.setItem(PROFILE_KEY, id);
}

function getCurrentUser() {
  const profiles = getMockProfiles();
  return profiles.find((user) => user.id === getMockProfileId()) || profiles[0];
}

function matchesWhere(item, where = {}) {
  return Object.entries(where).every(([key, value]) => item[key] === value);
}

function sortList(list, sort) {
  if (!sort) return list;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...list].sort((a, b) => {
    const av = a[field] || "";
    const bv = b[field] || "";
    return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
  });
}

function nextId(entity) {
  return `${entity.toLowerCase()}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function mockRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const url = new URL(path, window.location.origin);
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  if (parts[0] === 'chat') {
    const store = getMockStore(); const actor = getCurrentUser(); const body = JSON.parse(options.body || '{}');
    const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
    if (actor?.status !== 'ativo') fail('Acesso não autorizado.', 403);
    store._ChatMessages ||= []; store._ChatPresence ||= []; store._ChatReads ||= {};
    const messagesFor = target => store._ChatMessages.filter(m => (m.sender_id === actor.id && m.recipient_id === target) || (m.sender_id === target && m.recipient_id === actor.id)).sort((a, b) => a.created_date.localeCompare(b.created_date) || a.id.localeCompare(b.id));
    const unread = (rows, key) => rows.filter(m => m.sender_id !== actor.id && m.user_id !== actor.id && (!store._ChatReads[actor.id + ':' + key] || [m.created_date, m.id].join('|') > store._ChatReads[actor.id + ':' + key])).length;
    if (parts[1] === 'presence' && method === 'POST') {
      store._ChatPresence = store._ChatPresence.filter(p => p.user_id !== actor.id || p.session_id !== body.session_id);
      store._ChatPresence.push({ user_id: actor.id, session_id: body.session_id, available: body.available, at: Date.now() }); saveMockStore(store); return { ok: true };
    }
    if (parts[1] === 'overview') return clone({
      users: store.User.map(u => ({ ...u, online: u.status === 'ativo' && store._ChatPresence.some(p => p.user_id === u.id && p.available && Date.now() - p.at < 75000) })),
      cargos: store.Cargo, projects: store.Project,
      conversations: store.User.filter(u => u.id !== actor.id).flatMap(u => { const rows = messagesFor(u.id); const last = rows.at(-1); return last ? [{ user_id: u.id, last_message: last.text, created_date: last.created_date, unread_count: unread(rows, 'direct:' + u.id) }] : []; }),
      project_unread: store.Project.map(p => ({ project_id: p.id, unread_count: unread(store.ProjectMessage.filter(m => m.project_id === p.id), 'project:' + p.id) })),
    });
    if (parts[1] === 'messages') {
      const targetId = method === 'GET' ? url.searchParams.get('user_id') : body.recipient_id;
      const target = store.User.find(u => u.id === targetId);
      if (!target || target.id === actor.id) fail('Usuário não encontrado.', 404);
      if (method === 'GET') { let rows = messagesFor(targetId); const before = url.searchParams.get('before'); if (before) rows = rows.slice(0, rows.findIndex(m => m.id === before)); const start = Math.max(0, rows.length - 50); return clone({ messages: rows.slice(start), next_cursor: start ? rows[start].id : null }); }
      if (target.status !== 'ativo') fail('Esta conta não tem acesso ativo.', 403);
      const text = String(body.text || '').trim(); if (!text || text.length > 8000) fail('Mensagem inválida.');
      const existing = store._ChatMessages.find(m => m.sender_id === actor.id && m.client_id === body.client_id);
      if (existing) { if (existing.text !== text || existing.recipient_id !== target.id) fail('Envio já utilizado.', 409); return clone(existing); }
      const message = { id: nextId('dm'), sender_id: actor.id, recipient_id: target.id, text, client_id: body.client_id, created_date: new Date().toISOString() };
      store._ChatMessages.push(message); store.Notification.push({ id: nextId('Notification'), user_id: target.id, text: `Nova mensagem de ${actor.full_name || actor.email}`, link: `/?chat=direct&chatId=${actor.id}`, read: false, created_date: message.created_date }); saveMockStore(store); return clone(message);
    }
    if (parts[1] === 'read') {
      const rows = body.kind === 'direct' ? messagesFor(body.target_id) : store.ProjectMessage.filter(m => m.project_id === body.target_id);
      const message = rows.find(m => m.id === body.message_id); if (!message) fail('Mensagem não encontrada.', 404);
      const key = actor.id + ':' + body.kind + ':' + body.target_id; const cursor = [message.created_date, message.id].join('|');
      if (!store._ChatReads[key] || cursor > store._ChatReads[key]) store._ChatReads[key] = cursor;
      saveMockStore(store); return { ok: true };
    }
    fail('Requisição inválida.');
  }
  if (parts[0] === "reviews") {
    const body = JSON.parse(options.body || "{}");
    const store = getMockStore();
    const artifact = store[body.entity]?.find(row => row.id === body.record_id);
    if (!artifact) throw Object.assign(new Error("Arquivo não encontrado."), { status: 404 });
    const actor = getCurrentUser();
    const patch = prepareReview({ entity: body.entity, artifact, action: body.action, reviewer: store.User.find(user => user.id === body.reviewer_id), actor, comment: body.comment, expectedRequestId: body.review_request_id, now: new Date().toISOString(), requestId: nextId("review") });
    const projectId = body.entity === "TrackVersion" ? store.Track.find(track => track.id === artifact.track_id)?.project_id : artifact.project_id;
    Object.assign(artifact, patch);
    const verb = { request: "Revisão solicitada", approve: "Arquivo aprovado", request_changes: "Ajustes solicitados" }[body.action];
    store.ActivityLog.push({ id: nextId("ActivityLog"), project_id: projectId, text: `${verb}: ${artifact.name}${patch.review_comment ? ` — ${patch.review_comment}` : ""}`, user_name: actor.full_name || actor.email, artifact_entity: body.entity, artifact_id: artifact.id, review_action: body.action, review_status: patch.review_status, review_comment: patch.review_comment, created_date: new Date().toISOString() });
    const recipient = body.action === "request" ? body.reviewer_id : artifact.review_requested_by;
    if (recipient && recipient !== actor.id) store.Notification.push({ id: nextId("Notification"), user_id: recipient, project_id: projectId, text: `${verb}: ${artifact.name}`, link: `/projetos/${projectId}?tab=${body.entity === "TrackVersion" ? "faixas" : "operacao"}&review=${body.entity}&record=${encodeURIComponent(artifact.id)}`, read: false, created_date: new Date().toISOString() });
    saveMockStore(store);
    return clone(artifact);
  }

  if (parts[0] === "auth") {
    if (parts[1] === "me") {
      return clone(getCurrentUser());
    }
    if (parts[1] === "login") {
      const body = options.body instanceof FormData ? {} : JSON.parse(options.body || "{}");
      const store = getMockStore();
      const user = store.User.find((entry) => entry.email?.toLowerCase() === body.email?.toLowerCase()) || getCurrentUser();
      setMockProfileId(user.id);
      return { access_token: "mock-token", user: clone(user) };
    }
    if (parts[1] === "register") {
      const body = options.body instanceof FormData ? {} : JSON.parse(options.body || "{}");
      const store = getMockStore();
      const firstUser = !store.User.length;
      const user = {
        id: nextId("User"),
        email: body.email,
        full_name: body.full_name || "",
        role: firstUser ? "admin" : "user",
        permissao: firstUser ? "superadmin" : "membro",
        cargo: [],
        status: firstUser ? "ativo" : "pendente",
        created_date: new Date().toISOString(),
      };
      store.User.push(user);
      saveMockStore(store);
      setMockProfileId(user.id);
      return { access_token: "mock-token", user: clone(user) };
    }
    if (parts[1] === "google") return clone(getCurrentUser());
  }

  if (parts[0] === "upload") {
    return { file_url: "#" };
  }

  if (parts[0] !== "entities") {
    return {};
  }

  const entity = parts[1];
  const id = parts[2];
  const action = parts[3];
  const store = getMockStore();
  store[entity] = store[entity] || [];

  if (method === "GET") {
    if (id) {
      const item = store[entity].find((entry) => entry.id === id);
      if (!item) throw Object.assign(new Error("Registro nao encontrado"), { status: 404 });
      return clone(item);
    }
    const filter = url.searchParams.get("filter");
    const where = filter ? JSON.parse(filter) : null;
    let list = where ? store[entity].filter((item) => matchesWhere(item, where)) : store[entity];
    list = sortList(list, url.searchParams.get("sort"));
    const limit = Number(url.searchParams.get("limit") || 0);
    if (limit) list = list.slice(0, limit);
    return clone(list);
  }

  const body = options.body instanceof FormData ? {} : JSON.parse(options.body || "{}");
  const patches = body.items || [body.patch || body];
  if (patches.some(patch => protectedReviewPatch(entity, patch, method === "POST"))) throw Object.assign(new Error("Use o fluxo de revisão para alterar aprovações."), { status: 403 });

  if (method === "POST") {
    if (id === "bulk" || action === "bulk") {
      const created = (body.items || []).map((item) => ({ ...item, id: nextId(entity), created_date: now }));
      store[entity].push(...created);
      saveMockStore(store);
      return clone(created);
    }
    const created = { ...body, id: nextId(entity), created_date: new Date().toISOString() };
    store[entity].push(created);
    saveMockStore(store);
    return clone(created);
  }

  if (method === "PATCH") {
    if (id === "bulk" || action === "bulk") {
      const updated = [];
      for (const item of body.items || []) {
        const patch = item.$set || item;
        const index = store[entity].findIndex(record => record.id === item.id);
        if (index < 0) continue;
        store[entity][index] = { ...store[entity][index], ...patch, updated_date: new Date().toISOString() };
        updated.push(store[entity][index]);
      }
      saveMockStore(store);
      return clone(updated);
    }
    if (id === "many") {
      const patch = body.patch?.$set || body.patch || {};
      store[entity] = store[entity].map((item) => (matchesWhere(item, body.where) ? { ...item, ...patch } : item));
      saveMockStore(store);
      return { updated: true };
    }
    const patch = body.$set || body;
    store[entity] = store[entity].map((item) => (item.id === id ? { ...item, ...patch } : item));
    saveMockStore(store);
    return clone(store[entity].find((item) => item.id === id));
  }

  if (method === "DELETE") {
    if (id === "many") {
      store[entity] = store[entity].filter((item) => !matchesWhere(item, body.where));
    } else {
      store[entity] = store[entity].filter((item) => item.id !== id);
    }
    saveMockStore(store);
    return { deleted: true };
  }

  return {};
}
