import {
  getMockProfileId,
  getMockProfiles,
  isLocalMockEnabled,
  mockRequest,
  resetMockStore,
  setMockProfileId,
} from "@/api/mockData";
import { upload } from "@vercel/blob/client";

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

function uploadRequest(path, form, onProgress) {
  if (isLocalMockEnabled() && path.startsWith("/api/")) {
    onProgress?.(100);
    return mockRequest(path, { method: "POST", body: form });
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", path);
    xhr.timeout = 120000;
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        const error = new Error("O servidor de upload retornou uma resposta invalida");
        error.status = xhr.status;
        error.data = { raw: xhr.responseText };
        reject(error);
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(data);
        return;
      }
      const error = new Error(data.error || data.message || "Erro na requisicao");
      error.status = xhr.status;
      error.data = data;
      reject(error);
    };
    xhr.onerror = () => reject(new Error("Falha no upload"));
    xhr.ontimeout = () => reject(new Error("Tempo limite do upload excedido"));
    xhr.onabort = () => reject(new Error("Upload cancelado"));
    xhr.send(form);
  });
}

function safeUploadPath(file) {
  const rawName = file?.name || "arquivo";
  const normalized = rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return `uploads/${Date.now()}-${normalized || "arquivo"}`;
}

async function uploadDirectToBlob(file, onProgress) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const blob = await upload(safeUploadPath(file), file, {
    access: "public",
    handleUploadUrl: "/api/upload",
    headers,
    contentType: file.type || "application/octet-stream",
    multipart: true,
    onUploadProgress: ({ percentage }) => onProgress?.(Math.round(percentage || 0)),
  });
  onProgress?.(100);
  return { file_url: blob.url };
}

async function uploadFileRequest(file, onProgress) {
  if (!isLocalMockEnabled()) {
    try {
      return await uploadDirectToBlob(file, onProgress);
    } catch (error) {
      if (error?.status !== 503 && !String(error?.message || "").includes("BLOB_READ_WRITE_TOKEN")) {
        throw error;
      }
    }
  }
  const form = new FormData();
  form.append("file", file);
  return uploadRequest("/api/upload", form, onProgress);
}

function entityClient(entity) {
  const write = async (promise) => {
    const result = await promise;
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
