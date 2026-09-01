// ============================================================
// Workis — API client layer
// All backend communication goes through here.
// ============================================================

import type {
  ApiError,
  CompanyResponse,
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
  TimeEntryResponse,
  UpdateTimeEntryRequest,
  UserResponse,
  WorkplaceResponse,
} from "./types";

const API_BASE = "http://localhost:8080";

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

// ── Auth ─────────────────────────────────────────────────────

export const authApi = {
  login: (req: LoginRequest) =>
    request<LoginResponse>("POST", "/auth/login", req),

  register: (req: CreateUserRequest) =>
    request<LoginResponse>("POST", "/auth/register", req),

  registerWithInvitation: (req: CreateInvitedUserRequest) =>
    request<LoginResponse>("POST", "/auth/register/invitation/", req),
};

// ── Users ────────────────────────────────────────────────────

export const usersApi = {
  get: (id: number) => request<UserResponse>("GET", `/user/${id}`),
};

// ── Companies ────────────────────────────────────────────────

export const companiesApi = {
  create: (req: CreateCompanyRequest) =>
    request<CompanyResponse>("POST", "/companies", req),

  get: (id: number) => request<CompanyResponse>("GET", `/companies/${id}`),

  getMembers: (companyId: number) =>
    request<UserResponse[]>("GET", `/companies/${companyId}/members`),
};

// ── Workplaces ───────────────────────────────────────────────

export const workplacesApi = {
  create: (req: CreateWorkplaceRequest) =>
    request<WorkplaceResponse>("POST", "/workplace", req),

  get: (id: number) => request<WorkplaceResponse>("GET", `/workplaces/${id}`),

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
    request<ProjectResponse>("POST", "/project", req),

  get: (id: number) => request<ProjectResponse>("GET", `/project/${id}`),

  updateStatus: (projectId: number, status: ProjectStatus) =>
    request<ProjectResponse>("POST", `/project/${projectId}/status`, {
      status,
    }),

  /** Workers assigned to the project (scoped to the requesting user). */
  getWorkers: (projectId: number) =>
    request<UserResponse[]>("GET", `/project/${projectId}/workers`),

  /** Assign a company member to the project (managers only). */
  assignWorker: (projectId: number, workerId: number) =>
    request<void>("POST", `/project/${projectId}/assign`, { workerId }),

  /** Remove a worker from the project (managers only). */
  removeWorker: (projectId: number, workerId: number) =>
    request<void>("DELETE", `/project/${projectId}/workers/${workerId}`),
};

// ── Invitations ──────────────────────────────────────────────

export const invitationsApi = {
  get: (token: string) =>
    request<InvitationResponse>("GET", `/invites/${token}`),

  accept: (token: string) => request<void>("POST", `/invites/${token}`),

  invite: (req: InviteUserRequest) =>
    request<InvitationResponse>("POST", "/invites/", req),

  /** Invitations addressed to the logged-in user. */
  getMine: () => request<InvitationResponse[]>("GET", "/invites/"),

  /** Invitations the logged-in user (manager) has sent. */
  getSent: () => request<InvitationResponse[]>("GET", "/invites/sent"),
};

// ── Time tracking ────────────────────────────────────────────

export const timeTrackingApi = {
  start: (projectId: number) =>
    request<TimeEntryResponse>(
      "POST",
      `/projects/${projectId}/time-entries/start`
    ),

  stop: (timeEntryId: number) =>
    request<TimeEntryResponse>("POST", `/me/time-entries/${timeEntryId}/stop`),

  getMine: () => request<TimeEntryResponse[]>("GET", "/me/time-entries"),

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
};

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
