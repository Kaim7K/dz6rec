const TOKEN_KEY = "dz6_access_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function request(path, options = {}) {
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

function entityClient(entity) {
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
    create: (data) => request(`/api/entities/${entity}`, { method: "POST", body: JSON.stringify(data) }),
    bulkCreate: (items) => request(`/api/entities/${entity}/bulk`, { method: "POST", body: JSON.stringify({ items }) }),
    update: (id, data) => request(`/api/entities/${entity}/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    bulkUpdate: (items) => request(`/api/entities/${entity}/bulk`, { method: "PATCH", body: JSON.stringify({ items }) }),
    updateMany: (where, patch) => request(`/api/entities/${entity}/many`, { method: "PATCH", body: JSON.stringify({ where, patch }) }),
    delete: (id) => request(`/api/entities/${entity}/${id}`, { method: "DELETE" }),
    deleteMany: (where) => request(`/api/entities/${entity}/many`, { method: "DELETE", body: JSON.stringify({ where }) }),
    subscribe: () => () => {},
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
  "ProjectMessage",
  "SystemFlag",
  "Track",
  "TrackVersion",
  "User",
];

export const apiClient = {
  entities: Object.fromEntries(entityNames.map((name) => [name, entityClient(name)])),
  auth: {
    me: () => request("/api/auth/me"),
    loginViaEmailPassword: async (email, password) => {
      const result = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      if (result.access_token) localStorage.setItem(TOKEN_KEY, result.access_token);
      return result;
    },
    loginWithGoogle: (returnTo = "/") => {
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
      if (redirectTo) window.location.href = typeof redirectTo === "string" ? redirectTo : "/login";
    },
    redirectToLogin: (returnTo = window.location.pathname) => {
      window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
    },
  },
  users: {
    inviteUser: (email, role = "user") => request("/api/users/invite", { method: "POST", body: JSON.stringify({ email, role }) }),
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const form = new FormData();
        form.append("file", file);
        return request("/api/upload", { method: "POST", body: form });
      },
    },
  },
};
