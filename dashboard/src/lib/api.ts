const API_BASE = "/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ access_token: string; refresh_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, fullName?: string) =>
    request<{ access_token: string; refresh_token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName }),
    }),

  // Agents
  listAgents: () => request<any[]>("/agents"),
  getAgent: (id: string) => request<any>(`/agents/${id}`),
  createAgent: (data: { name: string; description?: string }) =>
    request<any>("/agents", { method: "POST", body: JSON.stringify(data) }),
  updateAgent: (id: string, data: Record<string, unknown>) =>
    request<any>(`/agents/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAgent: (id: string) =>
    request<void>(`/agents/${id}`, { method: "DELETE" }),

  // Agent versions
  listVersions: (agentId: string) => request<any[]>(`/agents/${agentId}/versions`),
  createVersion: (agentId: string, data: Record<string, unknown>) =>
    request<any>(`/agents/${agentId}/versions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  publishVersion: (agentId: string, versionId: string) =>
    request<any>(`/agents/${agentId}/versions/${versionId}/publish`, {
      method: "POST",
    }),

  // Calls
  listCalls: (limit = 50, offset = 0) =>
    request<any[]>(`/calls?limit=${limit}&offset=${offset}`),
  getCall: (id: string) => request<any>(`/calls/${id}`),
  getCallTranscript: (id: string) => request<any>(`/calls/${id}/transcript`),
};
