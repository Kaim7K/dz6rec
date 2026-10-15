import {
  getMockProfileId,
  getMockProfiles,
  isLocalMockEnabled,
  mockRequest,
  resetMockStore,
  setMockProfileId,
} from "@/api/mockData";
import { uploadFileToBlob } from "./fileUpload";
import { toast } from "@/components/ui/use-toast";

const TOKEN_KEY = "dz6_access_token";
const ENTITY_POLL_INTERVAL = 1200;
const realtimeChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("dz6-entity-events") : null;

function emitEntityChange(entity) {
  const payload = { entity, at: Date.now() };
  realtimeChannel?.postMessage(payload);
  window.dispatchEvent(new CustomEvent("dz6:entity-change", { detail: payload }));
}

function subscribeEntity(entity, callback, interval = ENTITY_POLL_INTERVAL) {
  let stopped = false;
  let timer = null;
  const notify = () => {
    if (!stopped && document.visibilityState !== "hidden") callback?.();
  };
  const schedule = () => {
    timer = window.setInterval(notify, interval);
  };
  const onLocal = (event) => {
    if (!event.detail?.entity || event.detail.entity === entity) notify();
  };
  const onRemote = (event) => {
    if (!event.data?.entity || event.data.entity === entity) notify();
  };
  const onFocus = () => notify();
  const onVisibility = () => {
    if (document.visibilityState === "visible") notify();
  };

  schedule();
  window.addEventListener("dz6:entity-change", onLocal);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibility);
  realtimeChannel?.addEventListener("message", onRemote);

  return () => {
    stopped = true;
    if (timer) window.clearInterval(timer);
    window.removeEventListener("dz6:entity-change", onLocal);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVisibility);
    realtimeChannel?.removeEventListener("message", onRemote);
  };
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  if (isLocalMockEnabled() && path.startsWith("/api/")) {
    return mockRequest(path, options);
  }

  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || "Erro na requisicao");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function uploadFileRequest(file, onProgress) {
  if (!isLocalMockEnabled()) {
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
    subscribe: (callback, options = {}) => subscribeEntity(entity, callback, options.interval),
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
