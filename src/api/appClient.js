import {
  getMockProfileId,
  getMockProfiles,
  isLocalMockEnabled,
  mockRequest,
  resetMockStore,
  setMockProfileId,
} from "@/api/mockData";
import { createEntitySubscriptions } from "./entitySubscriptions";
import { toast } from "@/components/ui/use-toast";

const TOKEN_KEY = "dz6_access_token";
const ENTITY_POLL_INTERVAL = 5000;
const realtimeChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("dz6-entity-events") : null;

function emitEntityChange(entity) {
  const payload = { entity, at: Date.now() };
  realtimeChannel?.postMessage(payload);
  window.dispatchEvent(new CustomEvent("dz6:entity-change", { detail: payload }));
}

const subscribeEntity = createEntitySubscriptions({ window, document, channel: realtimeChannel });

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

const pendingReads = new Map();
function request(path, options = {}) {
  const method = options.method || 'GET';
  // Share only simultaneous reads, never cache results or share caller-owned signals.
  if (method === 'GET' && !options.signal && !options.headers) {
    const key = JSON.stringify([getToken(), path]);
    if (pendingReads.has(key)) return pendingReads.get(key).then(value => structuredClone(value));
    const promise = performRequest(path, options); pendingReads.set(key, promise);
    const clear = () => { if (pendingReads.get(key) === promise) pendingReads.delete(key); };
    promise.then(clear, clear);
    return promise;
  }
  return performRequest(path, options).then(value => { pendingReads.clear(); return value; });
}

async function performRequest(path, options = {}) {
  if (isLocalMockEnabled() && path.startsWith("/api/")) {
    return mockRequest(path, options);
  }

  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  let data;
  try {
    response = await fetch(path, { ...options, headers, signal: options.signal || AbortSignal.timeout(30000) });
    data = await response.json();
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError' && !options.signal) throw new Error('O servidor demorou para responder. Tente novamente.');
    if (error instanceof SyntaxError) throw new Error('O servidor retornou uma resposta inválida. Tente novamente.');
    throw error;
  }
  if (!response.ok) {
    const error = Object.assign(new Error(data.error || data.message || "Erro na requisicao"), { status: response.status, data });
    throw error;
  }
  return data;
}

async function uploadFileRequest(file, onProgress) {
  if (!isLocalMockEnabled()) {
    const { uploadFileToBlob } = await import('./fileUpload');
    return uploadFileToBlob(file, { request, onProgress });
  }
  const form = new FormData();
  form.append("file", file);
  onProgress?.(100);
  return mockRequest("/api/upload", { method: "POST", body: form });
}

function entityClient(entity) {
  const write = async (promise) => {
    let result;
    try { result = await promise; }
    catch (error) {
      if (typeof document !== "undefined" && !document.querySelector('[role="dialog"], [role="alertdialog"]')) toast({ variant: "destructive", title: "Não foi possível salvar", description: error.message || "Tente novamente. Seus dados não foram confirmados." });
      throw error;
    }
    emitEntityChange(entity);
    return result;
  };

  return {
    list: (sort, limit) => {
      const params = new URLSearchParams();
      if (sort) params.set("sort", sort);
      if (limit) params.set("limit", String(limit));
      return request(`/api/entities/${entity}${params.toString() ? `?${params}` : ""}`);
    },
    get: (id) => request(`/api/entities/${entity}/${id}`),
    filter: (where = {}, sort, limit) => {
      const params = new URLSearchParams({ filter: JSON.stringify(where) });
      if (sort) params.set("sort", sort);
      if (limit) params.set("limit", String(limit));
      return request(`/api/entities/${entity}?${params}`);
    },
    create: (data) => write(request(`/api/entities/${entity}`, { method: "POST", body: JSON.stringify(data) })),
    bulkCreate: (items) => write(request(`/api/entities/${entity}/bulk`, { method: "POST", body: JSON.stringify({ items }) })),
    update: (id, data) => write(request(`/api/entities/${entity}/${id}`, { method: "PATCH", body: JSON.stringify(data) })),
    bulkUpdate: (items) => write(request(`/api/entities/${entity}/bulk`, { method: "PATCH", body: JSON.stringify({ items }) })),
    updateMany: (where, patch) => write(request(`/api/entities/${entity}/many`, { method: "PATCH", body: JSON.stringify({ where, patch }) })),
    delete: (id) => write(request(`/api/entities/${entity}/${id}`, { method: "DELETE" })),
    deleteMany: (where) => write(request(`/api/entities/${entity}/many`, { method: "DELETE", body: JSON.stringify({ where }) })),
    subscribe: (callback, options = {}) => subscribeEntity(entity, callback, options.interval ?? ENTITY_POLL_INTERVAL),
  };
}

const entityNames = [
  "ActivityLog",
  "Artist",
  "Cargo",
  "ChecklistItem",
  "ChecklistNote",
  "ChecklistSection",
  "ChecklistTemplate",
  "Notification",
  "Project",
  "ProjectFile",
  "ProjectMessage",
  "SystemFlag",
  "Track",
  "TrackVersion",
  "User",
];

export const apiClient = {
  chat: {
    overview: () => request('/api/chat/overview'),
    presence: data => request('/api/chat/presence', { method: 'POST', body: JSON.stringify(data), keepalive: true }),
    messages: (userId, before) => request('/api/chat/messages?' + new URLSearchParams({ user_id: userId, ...(before ? { before } : {}) })),
    send: async data => {
      const message = await request('/api/chat/messages', { method: 'POST', body: JSON.stringify(data) });
      emitEntityChange('DirectMessage'); emitEntityChange('Notification');
      return message;
    },
    markRead: data => request('/api/chat/read', { method: 'POST', body: JSON.stringify(data) }),
    subscribe: (callback, options = {}) => subscribeEntity('DirectMessage', callback, options.interval || 4000),
  },
  reviews: {
    submit: async data => {
      const result = await request("/api/reviews", { method: "POST", body: JSON.stringify(data) });
      emitEntityChange(data.entity);
      emitEntityChange("ActivityLog");
      emitEntityChange("Notification");
      return result;
    },
  },
  localMock: {
    enabled: isLocalMockEnabled,
    profiles: getMockProfiles,
    currentProfileId: getMockProfileId,
    setProfileId: setMockProfileId,
    reset: resetMockStore,
  },
  entities: Object.fromEntries(entityNames.map((name) => [name, entityClient(name)])),
  auth: {
    me: () => request("/api/auth/me"),
    loginViaEmailPassword: async (email, password) => {
      const result = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      if (result.access_token) localStorage.setItem(TOKEN_KEY, result.access_token);
      return result;
    },
    loginWithGoogle: (returnTo = "/") => {
      if (isLocalMockEnabled()) {
        window.location.href = returnTo;
        return;
      }
      window.location.href = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
    },
    register: async ({ email, password, full_name }) => {
      const result = await request("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password, full_name }) });
      if (result.access_token) localStorage.setItem(TOKEN_KEY, result.access_token);
      return result;
    },
    setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
    updateMe: (data) => request("/api/auth/update-me", { method: "PATCH", body: JSON.stringify(data) }),
    resetPasswordRequest: (email) => request("/api/auth/reset-request", { method: "POST", body: JSON.stringify({ email }) }),
    resetPassword: ({ resetToken, newPassword }) => request("/api/auth/reset", { method: "POST", body: JSON.stringify({ resetToken, newPassword }) }),
    logout: (redirectTo) => {
      localStorage.removeItem(TOKEN_KEY);
      if (isLocalMockEnabled()) {
        window.location.reload();
        return;
      }
      if (redirectTo) window.location.href = typeof redirectTo === "string" ? redirectTo : "/login";
    },
    redirectToLogin: (returnTo = window.location.pathname) => {
      window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
    },
  },
  users: {
    inviteUser: (email, role = "user", cargo) => request("/api/users/invite", { method: "POST", body: JSON.stringify({ email, role, cargo }) }),
  },
  integrations: {
    Core: {
      UploadFile: async ({ file, onProgress }) => {
        return uploadFileRequest(file, onProgress);
      },
    },
  },
};
