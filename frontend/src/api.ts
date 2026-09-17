// ============================================================
// Logis — API client layer
// All backend communication goes through here.
// ============================================================

import type {
  ApiError,
  CompanyResponse,
  CompanySettingsResponse,
  CreateCompanyRequest,
  CreateInvitedUserRequest,
  CreateTimeEntryRequest,
  InviteUserRequest,
  CreateProjectRequest,
  CreateUserRequest,
  CreateWorkplaceRequest,
  InvitationResponse,
  LoginRequest,
  LoginResponse,
  ProjectResponse,
  ProjectStatus,
  StartTimeEntryRequest,
  TimeEntryResponse,
  TimeWorkedResponse,
  UpdateCompanyRequest,
  UpdateCompanySettingsRequest,
  UpdateTimeEntryRequest,
  UpdateUserSettingsRequest,
  UpdateWorkplaceRequest,
  UpdateProjectRequest,
  UserResponse,
  UserSettingsResponse,
  WorkplaceResponse,
} from "./types";

// API base URL resolution:
// - If VITE_API_BASE is provided at build/run time, use it.
// - Otherwise, derive from the current page's hostname so the frontend
//   served from the developer machine (e.g. http://192.168.1.9:5173)
//   will point API calls to the same device on the common backend port.
// - Falls back to http://localhost:8080 for node-side usage or unknown env.
const _VITE_API_BASE =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_API_BASE) ||
  "";
const _VITE_API_PORT =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_API_PORT) ||
  "8080";

const API_BASE: string = (() => {
  if (_VITE_API_BASE) return _VITE_API_BASE;
  if (typeof window !== "undefined") {
    const proto = window.location.protocol || "http:";
    const host = window.location.hostname || "localhost";
    return `${proto}//${host}:${_VITE_API_PORT}`;
  }
  return "http://localhost:8080";
})();

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export class ApiRequestError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError(
      0,
      "NETWORK_ERROR",
      "Unable to reach the server. Please check your connection."
    );
  }

  if (!response.ok) {
    let errorData: ApiError | null = null;
    try {
      errorData = (await response.json()) as ApiError;
    } catch {
      // ignore parse errors
    }

    const message =
      errorData?.message || "Something went wrong. Please try again.";
    const code = errorData?.error || "UNKNOWN_ERROR";
    throw new ApiRequestError(response.status, code, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/**
 * Like request(), but for binary downloads (PDF/CSV exports). Returns the
 * raw Blob; error responses are parsed as JSON exactly like request().
 * (The Content-Disposition filename is not readable cross-origin, so the
 * callers construct their own file names.)
 */
async function requestBlob(method: string, path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { method, headers });
  } catch {
    throw new ApiRequestError(
      0,
      "NETWORK_ERROR",
      "Unable to reach the server. Please check your connection."
    );
  }

  if (!response.ok) {
    let errorData: ApiError | null = null;
    try {
      errorData = (await response.json()) as ApiError;
    } catch {
      // ignore parse errors
    }

    const message =
      errorData?.message || "Something went wrong. Please try again.";
    const code = errorData?.error || "UNKNOWN_ERROR";
    throw new ApiRequestError(response.status, code, message);
  }

  return await response.blob();
}

/** Trigger a browser download for a Blob and clean up afterwards. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Export file formats supported by the worked-hours export endpoints. */
export type ExportFormat = "pdf" | "csv";

/** A downloaded export, ready to be saved via downloadBlob(). */
export interface ExportDownload {
  blob: Blob;
  fileName: string;
}

// ── Auth ─────────────────────────────────────────────────────

export const authApi = {
  login: (req: LoginRequest) =>
    request<LoginResponse>("POST", "/auth/login", req),

  register: (req: CreateUserRequest) =>
    request<LoginResponse>("POST", "/auth/register", req),

  registerWithInvitation: (req: CreateInvitedUserRequest) =>
    request<LoginResponse>("POST", "/auth/register/invitation", req),
};

// ── Users ────────────────────────────────────────────────────

export const usersApi = {
  get: (id: number) => request<UserResponse>("GET", `/user/${id}`),
};

// ── User settings ────────────────────────────────────────────

export const userSettingsApi = {
  /** Fetch the current user's settings (creates defaults on first call). */
  get: () => request<UserSettingsResponse>("GET", "/me/settings"),

  /** Update the current user's settings. */
  update: (req: UpdateUserSettingsRequest) =>
    request<UserSettingsResponse>("PUT", "/me/settings", req),
};

// ── Companies ────────────────────────────────────────────────

export const companiesApi = {
  create: (req: CreateCompanyRequest) =>
    request<CompanyResponse>("POST", "/company", req),

  get: (_companyId?: number) => request<CompanyResponse>("GET", "/company"),

  /** Edit the company name (owner only). */
  edit: (req: UpdateCompanyRequest) =>
    request<CompanyResponse>("PUT", "/company", req),

  /** Fetch the company settings (any member). */
  getSettings: () =>
    request<CompanySettingsResponse>("GET", "/company/settings"),

  /** Update the company settings (manager+). */
  updateSettings: (req: UpdateCompanySettingsRequest) =>
    request<CompanySettingsResponse>("PUT", "/company/settings", req),

  getMembers: (_companyId?: number) =>
    request<UserResponse[]>("GET", "/company/members"),

  /** Promote a company member to manager (owner only). */
  promote: (userId: number) =>
    request<void>("POST", `/company/manager/${userId}`),

  /** Demote a manager back to a regular worker (owner only). */
  demote: (userId: number) =>
    request<void>("DELETE", `/company/manager/${userId}`),

  /** Remove a member from the company (owner only). */
  kick: (userId: number) => request<void>("POST", `/company/kick/${userId}`),

  /** Transfer company ownership to another member (owner only). The
   *  former owner becomes a manager. */
  transferOwnership: (userId: number) =>
    request<void>("PUT", `/company/owner/${userId}`),
};

// ── Workplaces ───────────────────────────────────────────────

export const workplacesApi = {
  create: (req: CreateWorkplaceRequest) =>
    request<WorkplaceResponse>("POST", "/workplaces", req),

  get: (id: number) => request<WorkplaceResponse>("GET", `/workplaces/${id}`),

  /** Update a workplace's name/location/fence radius (managers only). */
  update: (id: number, req: UpdateWorkplaceRequest) =>
    request<WorkplaceResponse>("PUT", `/workplaces/${id}`, req),

  /** Delete a workplace and all of its data (managers only). */
  delete: (id: number) => request<void>("DELETE", `/workplaces/${id}`),

  /**
   * Workplaces visible to the logged-in user — the backend scopes the
   * result by the authenticated user's company.
   */
  getMine: () => request<WorkplaceResponse[]>("GET", "/workplaces"),

  getProjects: (workplaceId: number) =>
    request<ProjectResponse[]>("GET", `/workplaces/${workplaceId}/projects`),
};

// ── Projects ─────────────────────────────────────────────────

export const projectsApi = {
  create: (req: CreateProjectRequest) =>
    request<ProjectResponse>("POST", "/projects", req),

  get: (id: number) => request<ProjectResponse>("GET", `/projects/${id}`),

  /** Update a project's name/start date/deadline (managers only). */
  update: (id: number, req: UpdateProjectRequest) =>
    request<ProjectResponse>("PUT", `/projects/${id}`, req),

  updateStatus: (projectId: number, status: ProjectStatus) =>
    request<ProjectResponse>("POST", `/projects/${projectId}/status`, {
      status,
    }),

  /** Workers assigned to the project (scoped to the requesting user). */
  getWorkers: (projectId: number) =>
    request<UserResponse[]>("GET", `/projects/${projectId}/workers`),

  /** Assign a company member to the project (managers only). */
  assignWorker: (projectId: number, workerId: number) =>
    request<void>("POST", `/projects/${projectId}/assign/${workerId}`),

  /** Remove a worker from the project (managers only). */
  removeWorker: (projectId: number, workerId: number) =>
    request<void>("DELETE", `/projects/${projectId}/workers/${workerId}`),

  /** Delete a project and all of its data (managers only). */
  delete: (id: number) => request<void>("DELETE", `/projects/${id}`),
};

// ── Invitations ──────────────────────────────────────────────

export const invitationsApi = {
  get: (token: string) =>
    request<InvitationResponse>("GET", `/invites/${token}`),

  accept: (token: string) => request<void>("POST", `/invites/${token}`),

  invite: (req: InviteUserRequest) =>
    request<InvitationResponse>("POST", "/invites", req),

  /** Invitations addressed to the logged-in user. */
  getMine: () => request<InvitationResponse[]>("GET", "/invites"),

  /** Invitations the logged-in user (manager) has sent. */
  getSent: () => request<InvitationResponse[]>("GET", "/invites/sent"),
};

// ── Time tracking ────────────────────────────────────────────

export const timeTrackingApi = {
  /**
   * Start the timer. Coordinates are optional — the backend flags the entry
   * LOGGED_OUTSIDE when they are missing or outside the workplace geofence.
   */
  start: (projectId: number, coords: StartTimeEntryRequest) =>
    request<TimeEntryResponse>(
      "POST",
      `/projects/${projectId}/time-entries/start`,
      coords
    ),

  stop: (timeEntryId: number) =>
    request<TimeEntryResponse>("POST", `/me/time-entries/${timeEntryId}/stop`),

  getMine: () => request<TimeEntryResponse[]>("GET", "/me/time-entries"),

  /**
   * All time entries of a company member across every project. Managers may
   * view any member of their company; regular users only their own.
   */
  getByUser: (userId: number) =>
    request<TimeEntryResponse[]>("GET", `/time-entries/${userId}`),

  /**
   * Time entries for a workplace. The backend decides the scope:
   * managers receive everyone's entries in that workplace, regular
   * members receive only their own.
   */
  getByWorkplace: (workplaceId: number) =>
    request<TimeEntryResponse[]>(
      "GET",
      `/workplaces/${workplaceId}/time-entries`
    ),

  /**
   * Time entries for a project. The backend decides the scope:
   * managers receive everyone's entries for that project, regular
   * members receive only their own.
   */
  getByProject: (projectId: number) =>
    request<TimeEntryResponse[]>("GET", `/projects/${projectId}/time-entries`),

  /** Create a manual time entry for a worker on a project (managers only). */
  create: (projectId: number, body: CreateTimeEntryRequest) =>
    request<TimeEntryResponse>(
      "POST",
      `/projects/${projectId}/time-entries`,
      body
    ),

  /** Update a time entry's start/end times (managers only). */
  update: (timeEntryId: number, body: UpdateTimeEntryRequest) =>
    request<TimeEntryResponse>("PUT", `/time-entries/${timeEntryId}`, body),

  /** Delete a time entry (managers only). */
  delete: (timeEntryId: number) =>
    request<void>("DELETE", `/time-entries/${timeEntryId}`),

  /**
   * Per-day worked time for the logged-in user, computed on the backend
   * (grouped by calendar day, company rules like the lunch deduction
   * already applied). Optional from/to are ISO instants.
   */
  getMyTimeWorked: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const query = qs.toString();
    return request<TimeWorkedResponse[]>(
      "GET",
      `/me/time-worked${query ? `?${query}` : ""}`
    );
  },

  /**
   * Per-day worked time of a company member. Managers may view any member
   * of their company; regular users only themselves.
   */
  getTimeWorkedByUser: (userId: number, from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const query = qs.toString();
    return request<TimeWorkedResponse[]>(
      "GET",
      `/time-worked/${userId}${query ? `?${query}` : ""}`
    );
  },

  /**
   * Per-user, per-day worked time for a project. The backend decides the
   * scope: managers receive everyone's rows, regular members only their own.
   */
  getTimeWorkedByProject: (projectId: number) =>
    request<TimeWorkedResponse[]>("GET", `/projects/${projectId}/time-worked`),

  /**
   * Per-user, per-day worked time for a workplace. The backend decides the
   * scope: managers receive everyone's rows, regular members only their own.
   */
  getTimeWorkedByWorkplace: (workplaceId: number) =>
    request<TimeWorkedResponse[]>(
      "GET",
      `/workplaces/${workplaceId}/time-worked`
    ),

  /**
   * Per-user, per-day worked time for the whole company (managers only).
   * Optional from/to are ISO instants.
   */
  getCompanyTimeWorked: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const query = qs.toString();
    return request<TimeWorkedResponse[]>(
      "GET",
      `/company/time-worked${query ? `?${query}` : ""}`
    );
  },

  /**
   * Download the logged-in user's worked hours as PDF or CSV. Optional
   * year/month limits the report to one calendar month (evaluated in the
   * company timezone); omitting both exports all recorded time.
   */
  exportMyTimeWorked: async (
    format: ExportFormat,
    year?: number,
    month?: number
  ): Promise<ExportDownload> => {
    const qs = new URLSearchParams();
    if (year != null) qs.set("year", String(year));
    if (month != null) qs.set("month", String(month));
    qs.set("format", format);
    const blob = await requestBlob(
      "GET",
      `/me/time-worked/export?${qs.toString()}`
    );
    return {
      blob,
      fileName: exportFileName("hours", period(year, month), format),
    };
  },

  /**
   * Download a company member's worked hours as PDF or CSV. Managers may
   * export any member of their company; regular users only themselves.
   */
  exportUserTimeWorked: async (
    userId: number,
    format: ExportFormat,
    year?: number,
    month?: number
  ): Promise<ExportDownload> => {
    const qs = new URLSearchParams();
    if (year != null) qs.set("year", String(year));
    if (month != null) qs.set("month", String(month));
    qs.set("format", format);
    const blob = await requestBlob(
      "GET",
      `/time-worked/${userId}/export?${qs.toString()}`
    );
    return {
      blob,
      fileName: exportFileName(`hours-${userId}`, period(year, month), format),
    };
  },

  /**
   * Download every member's worked hours as PDF or CSV (managers only).
   * Optional year/month limits the report to one calendar month.
   */
  exportCompanyTimeWorked: async (
    format: ExportFormat,
    year?: number,
    month?: number
  ): Promise<ExportDownload> => {
    const qs = new URLSearchParams();
    if (year != null) qs.set("year", String(year));
    if (month != null) qs.set("month", String(month));
    qs.set("format", format);
    const blob = await requestBlob(
      "GET",
      `/company/time-worked/export?${qs.toString()}`
    );
    return {
      blob,
      fileName: exportFileName("hours-everyone", period(year, month), format),
    };
  },
};

function period(year?: number, month?: number): string {
  return year != null && month != null
    ? `${year}-${String(month).padStart(2, "0")}`
    : "all";
}

function exportFileName(base: string, period: string, format: string): string {
  return `${base}-${period}.${format}`;
}

// ── Helpers ──────────────────────────────────────────────────

export function isApiError(err: unknown): err is ApiRequestError {
  return err instanceof ApiRequestError;
}

export function getErrorMessage(err: unknown): string {
  if (isApiError(err)) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Something went wrong. Please try again.";
}
