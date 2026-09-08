// ============================================================
// Logis — Shared TypeScript types
// Mirrors the backend DTOs.
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface CreateUserRequest {
  name: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
}

/**
 * Role within a company — mirrors the backend CompanyRole enum.
 */
export type CompanyRole = "USER" | "MANAGER";

export interface UserResponse {
  id: number;
  name: string;
  lastname: string;
  username: string;
  email: string;
  companyRole: CompanyRole;
  companyId: number | null;
}

export interface CompanyResponse {
  id: number;
  name: string;
}

export interface CreateCompanyRequest {
  name: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  street: string;
  address: string;
}

export interface WorkplaceResponse {
  id: number;
  name: string;
  location: Location | null;
  companyId: number;
  /** Geofence radius in meters (backend field: radiusMeters). */
  radiusDistance: number;
}

export interface CreateWorkplaceRequest {
  name: string;
  location: Location | null;
  radiusDistance: number | null;
}

/** Body for updating a workplace (managers only). Omitted fields keep their values. */
export interface UpdateWorkplaceRequest {
  name: string;
  location: Location | null;
  radiusDistance: number | null;
}

/**
 * Project status — mirrors the backend ProjectStatus enum.
 */
export type ProjectStatus =
  | "PENDING"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "ON_HOLD";

export interface ProjectResponse {
  id: number;
  projectName: string;
  startDate: string | null; // ISO date
  deadline: string | null; // ISO date
  workplaceId: number;
  projectStatus: ProjectStatus;
}

export interface CreateProjectRequest {
  projectName: string;
  workplaceId: number;
  startDate: string | null;
  deadline: string | null;
}

/** Body for updating an existing project (managers only). */
export interface UpdateProjectRequest {
  projectName: string;
  startDate: string | null;
  deadline: string | null;
  projectStatus: ProjectStatus;
}

/**
 * How a time entry was logged — mirrors the backend TimeEntryLogStatus enum.
 */
export type TimeEntryLogStatus =
  | "LOGGED" // normal timer start/stop by the worker
  | "LOGGED_OUTSIDE" // timer started outside the workplace geofence (or without coords)
  | "MANUAL_ENTRY" // created by hand by a manager
  | "EDITED"; // times changed after logging

export interface TimeEntryResponse {
  id: number;
  projectWorkerId: number;
  /** The id of the user who worked this entry (used for manager member filtering). */
  workerId: number;
  projectId: number;
  startTime: string; // ISO instant
  endTime: string | null; // ISO instant
  /**
   * The backend sends total seconds as a plain number. The other variants
   * (`{ seconds, nano }` object, ISO-8601 "PT1H30M" string) are accepted
   * defensively by `durationToSeconds` in case serialization config changes.
   */
  duration: number | { seconds: number; nano: number } | string | null;
  lunchLength: number;
  status: TimeEntryLogStatus;
}

/** Body for starting the timer. Coordinates are optional — the backend
 *  flags the entry LOGGED_OUTSIDE when they are missing or outside the
 *  workplace geofence. */
export interface StartTimeEntryRequest {
  latitude: number | null;
  longitude: number | null;
}

/** Body for creating a manual time entry (managers only). */
export interface CreateTimeEntryRequest {
  workerId: number;
  startTime: string; // ISO instant
  endTime: string; // ISO instant
  lunchLength: number;
}

/** Body for updating an existing time entry (managers only). */
export interface UpdateTimeEntryRequest {
  startTime: string; // ISO instant
  endTime: string; // ISO instant
  lunchLength: number;
}

export type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELLED";

export interface InvitationResponse {
  companyName: string;
  email: string;
  status: InvitationStatus;
  expiresAt: string;
  userExists: boolean;
  token: string;
}

export interface CreateInvitedUserRequest {
  name: string;
  lastname: string;
  username: string;
  password: string;
  token: string;
}

export interface InviteUserRequest {
  email: string;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface AppUser {
  id: number;
  name: string;
  lastname: string;
  username: string;
  email: string;
  companyRole: CompanyRole;
  companyId: number | null;
}
