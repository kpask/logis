import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  companiesApi,
  getErrorMessage,
  isApiError,
  projectsApi,
  timeTrackingApi,
  workplacesApi,
} from "../api";
import ClockInModal from "../ClockInModal";
import MapPicker from "../MapPicker";
import type {
  CompanyResponse,
  CompanySettingsResponse,
  Location,
  ProjectResponse,
  ProjectStatus,
  TimeEntryResponse,
  TimeWorkedResponse,
  UserResponse,
  WorkplaceResponse,
} from "../types";
import { useAuth } from "../auth";
import type { MemberFilterValue } from "../components";
import {
  Alert,
  EmptyState,
  IconChevronRight,
  IconClock,
  IconFolder,
  IconMapPin,
  IconPlay,
  IconPlus,
  IconStop,
  IconTrash,
  LoadingState,
  MemberSelect,
  Modal,
  MonthCalendar,
  StatusBadge,
} from "../components";
import {
  distanceMeters,
  durationToSeconds,
  formatDate,
  formatDateTime,
  formatDuration,
  formatDurationHuman,
  formatMonthDay,
  formatTime,
  fromLocalDateTimeValue,
  getBrowserPosition,
  isManagerOrHigher,
  parseDate,
  toDateKey,
  toLocalDateTimeValue,
  workedSecondsForDate,
  workedSecondsInMonth,
} from "../utils";
import { useI18n } from "../i18n";

// Mirrors the backend ProjectStatus enum.
const PROJECT_STATUSES: ProjectStatus[] = [
  "PENDING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
  "ON_HOLD",
];

interface WorkplacePageProps {
  workplaceId: number;
  onBack: () => void;
  onOpenProject: (projectId: number) => void;
}

export default function WorkplacePage({
  workplaceId,
  onBack,
  onOpenProject,
}: WorkplacePageProps) {
  const { user } = useAuth();
  const { t, language } = useI18n();

  const [workplace, setWorkplace] = useState<WorkplaceResponse | null>(null);
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noAccess, setNoAccess] = useState(false);

  // Time tracking / calendar state
  const [timeEntries, setTimeEntries] = useState<TimeEntryResponse[]>([]);
  // Per-user, per-day worked time computed by the backend (lunch already
  // deducted) — the frontend only filters and displays these rows.
  const [timeWorked, setTimeWorked] = useState<TimeWorkedResponse[]>([]);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(today));

  // Manager member filter ("all" or a user id) — managers only.
  const [members, setMembers] = useState<UserResponse[]>([]);
  const [isManager, setIsManager] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<MemberFilterValue>("all");

  // Edit workplace modal (managers only): name, location and geofence radius.
  const [showEditWorkplace, setShowEditWorkplace] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [editRadius, setEditRadius] = useState(150);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete workplace
  const [workplaceDeleting, setWorkplaceDeleting] = useState(false);
  const [workplaceDeleteError, setWorkplaceDeleteError] = useState<
    string | null
  >(null);

  // Create project modal
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectDeadline, setProjectDeadline] = useState("");
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  // Edit project modal
  const [showEditProject, setShowEditProject] = useState(false);
  const [editProjectId, setEditProjectId] = useState<number | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectStartDate, setEditProjectStartDate] = useState("");
  const [editProjectDeadline, setEditProjectDeadline] = useState("");
  const [editProjectStatus, setEditProjectStatus] =
    useState<ProjectStatus>("ACTIVE");
  const [editProjectSubmitting, setEditProjectSubmitting] = useState(false);
  const [editProjectError, setEditProjectError] = useState<string | null>(null);

  // Delete project
  const [projectDeletingId, setProjectDeletingId] = useState<number | null>(
    null
  );
  const [projectDeleteError, setProjectDeleteError] = useState<string | null>(
    null
  );

  // Timer (start from the workplace; a project is required for attribution)
  const [timerActionLoading, setTimerActionLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [timerError, setTimerError] = useState<string | null>(null);
  const [showStartTimerModal, setShowStartTimerModal] = useState(false);
  const [startTimerProjectId, setStartTimerProjectId] = useState<number | "">(
    ""
  );
  const [clockInPrompt, setClockInPrompt] = useState<{
    projectId: number;
    position: { latitude: number; longitude: number } | null;
  } | null>(null);

  // Company settings (default work times for the manual add-entry form)
  const [companySettings, setCompanySettings] =
    useState<CompanySettingsResponse | null>(null);

  // Manager add-entry modal state (workplace level: project + worker + times)
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [addEntryProjectId, setAddEntryProjectId] = useState<number | "">("");
  const [addEntryWorkerId, setAddEntryWorkerId] = useState<number | "">("");
  const [addEntryProjectWorkers, setAddEntryProjectWorkers] = useState<
    UserResponse[]
  >([]);
  const [addEntryWorkersLoading, setAddEntryWorkersLoading] = useState(false);
  const [addEntryStart, setAddEntryStart] = useState("");
  const [addEntryEnd, setAddEntryEnd] = useState("");
  const [entrySubmitting, setEntrySubmitting] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Manager edit/delete modal state
  const [editingEntry, setEditingEntry] = useState<TimeEntryResponse | null>(
    null
  );
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [entryEditSubmitting, setEntryEditSubmitting] = useState(false);
  const [entryEditError, setEntryEditError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoAccess(false);

    try {
      // Entries scoped to this workplace by the backend (managers get
      // everyone's entries across its projects, regular members get
      // only their own). Worked-time totals come pre-computed from the
      // backend as per-user, per-day rows.
      const [wp, proj, entries, worked] = await Promise.all([
        workplacesApi.get(workplaceId),
        workplacesApi.getProjects(workplaceId),
        timeTrackingApi.getByWorkplace(workplaceId),
        timeTrackingApi.getTimeWorkedByWorkplace(workplaceId),
      ]);
      setWorkplace(wp);
      setProjects(proj);
      setTimeEntries(entries);
      setTimeWorked(worked);

      if (wp.companyId) {
        const comp = await companiesApi.get(wp.companyId);
        setCompany(comp);

        // Determine whether the current user is a company manager and
        // load the member list for the manager filter dropdown.
        if (user) {
          try {
            const memberList = await companiesApi.getMembers(wp.companyId);
            const me = memberList.find((m) => m.id === user.id);
            setIsManager(isManagerOrHigher(me?.companyRole));
            setMembers(memberList);

            if (isManagerOrHigher(me?.companyRole)) {
              // Company settings (default work times for the add-entry form)
              try {
                setCompanySettings(await companiesApi.getSettings());
              } catch {
                setCompanySettings(null);
              }
            }
          } catch {
            setIsManager(false);
            setMembers([]);
          }
        }
      }
    } catch (err) {
      // The backend rejects workplaces the user is not a member of (403).
      if (isApiError(err) && err.status === 403) {
        setNoAccess(true);
      }
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [workplaceId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset the member filter when switching workplaces.
  useEffect(() => {
    setSelectedMember("all");
  }, [workplaceId]);

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function openEditWorkplaceModal() {
    setEditName(workplace?.name ?? "");
    setEditLocation(workplace?.location ?? null);
    setEditRadius(workplace?.radiusDistance ?? 150);
    setEditError(null);
    setShowEditWorkplace(true);
  }

  async function handleSaveWorkplace(e: FormEvent) {
    e.preventDefault();
    if (!workplace) return;
    if (!editName.trim()) {
      setEditError(t("createWorkplaceNameRequired"));
      return;
    }

    setEditSubmitting(true);
    setEditError(null);
    try {
      const updated = await workplacesApi.update(workplace.id, {
        name: editName.trim(),
        location: editLocation,
        radiusDistance: editRadius,
      });
      setWorkplace(updated);
      setShowEditWorkplace(false);
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDeleteWorkplace() {
    if (!workplace) return;
    const confirmed = window.confirm(
      t("workplacesDeleteConfirm").replace("{name}", workplace.name)
    );
    if (!confirmed) return;

    setWorkplaceDeleteError(null);
    setWorkplaceDeleting(true);
    try {
      await workplacesApi.delete(workplace.id);
      onBack();
    } catch (err) {
      setWorkplaceDeleteError(getErrorMessage(err));
    } finally {
      setWorkplaceDeleting(false);
    }
  }

  async function handleCreateProject(e: FormEvent) {
    e.preventDefault();
    setProjectError(null);

    if (!projectName.trim()) {
      setProjectError(t("createProjectNameRequired"));
      return;
    }

    setProjectSubmitting(true);
    try {
      const created = await projectsApi.create({
        projectName: projectName.trim(),
        workplaceId,
        startDate: projectStartDate || null,
        deadline: projectDeadline || null,
      });
      setProjects((prev) => [...prev, created]);
      setShowCreateProject(false);
      setProjectName("");
      setProjectStartDate("");
      setProjectDeadline("");
    } catch (err) {
      setProjectError(getErrorMessage(err));
    } finally {
      setProjectSubmitting(false);
    }
  }

  function openEditProjectModal(project: ProjectResponse) {
    setEditProjectId(project.id);
    setEditProjectName(project.projectName);
    setEditProjectStartDate(project.startDate ?? "");
    setEditProjectDeadline(project.deadline ?? "");
    setEditProjectStatus(project.projectStatus);
    setEditProjectError(null);
    setShowEditProject(true);
  }

  async function handleEditProject() {
    if (!editProjectId) return;

    setEditProjectSubmitting(true);
    setEditProjectError(null);
    try {
      const updated = await projectsApi.update(editProjectId, {
        projectName: editProjectName,
        startDate: editProjectStartDate || null,
        deadline: editProjectDeadline || null,
        projectStatus: editProjectStatus,
      });
      setProjects((prev) =>
        prev.map((p) => (p.id === editProjectId ? updated : p))
      );
      setShowEditProject(false);
    } catch (err) {
      setEditProjectError(getErrorMessage(err));
    } finally {
      setEditProjectSubmitting(false);
    }
  }

  async function handleDeleteProject(project: ProjectResponse) {
    const confirmed = window.confirm(
      t("projectDeleteConfirm").replace("{name}", project.projectName)
    );
    if (!confirmed) return;

    setProjectDeleteError(null);
    setProjectDeletingId(project.id);
    try {
      await projectsApi.delete(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (err) {
      setProjectDeleteError(getErrorMessage(err));
    } finally {
      setProjectDeletingId(null);
    }
  }

  // ── Timer (start/stop from the workplace) ───────────────────

  async function startTimer(
    projectId: number,
    coords: { latitude: number; longitude: number } | null
  ) {
    setTimerActionLoading(true);
    try {
      const entry = await timeTrackingApi.start(projectId, {
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      });
      if (entry.status === "LOGGED_OUTSIDE") {
        setTimerError(t("projectTimerOutsideWarning"));
      }
      await loadData();
    } catch (err) {
      setTimerError(getErrorMessage(err));
    } finally {
      setTimerActionLoading(false);
    }
  }

  /**
   * Start flow for a chosen project: locate the worker first; inside the
   * work area (or workplace without location) → start silently; outside /
   * location unavailable → open the confirmation popup.
   */
  async function beginStartTimer(projectId: number) {
    setTimerError(null);
    setLocating(true);
    try {
      const position = await getBrowserPosition();

      const wp = workplace?.location ?? null;
      const radius = workplace?.radiusDistance ?? 150;
      const inside =
        !wp ||
        !position ||
        distanceMeters(
          wp.latitude,
          wp.longitude,
          position.latitude,
          position.longitude
        ) <= radius;

      if (inside) {
        await startTimer(projectId, position);
      } else {
        setClockInPrompt({ projectId, position });
      }
    } finally {
      setLocating(false);
    }
  }

  function handleStartTimerClick() {
    setTimerError(null);
    // Only one project available → start immediately, no picker.
    if (projects.length === 1) {
      void beginStartTimer(projects[0].id);
      return;
    }
    setStartTimerProjectId("");
    setShowStartTimerModal(true);
  }

  async function handleStopTimer() {
    if (!myRunningEntry) return;
    setTimerError(null);
    setTimerActionLoading(true);
    try {
      await timeTrackingApi.stop(myRunningEntry.id);
      await loadData();
    } catch (err) {
      setTimerError(getErrorMessage(err));
    } finally {
      setTimerActionLoading(false);
    }
  }

  // ── Manager time-entry management (add / edit / delete) ─────

  function openAddEntryModal() {
    setAddEntryProjectId("");
    setAddEntryWorkerId("");
    setAddEntryProjectWorkers([]);
    const settings = companySettings;
    setAddEntryStart(
      `${selectedDate}T${settings?.defaultStartTime ?? "07:30"}`
    );
    setAddEntryEnd(`${selectedDate}T${settings?.defaultEndTime ?? "16:30"}`);
    setEntryError(null);
    setShowAddEntryModal(true);
  }

  // When the chosen project changes, load its active workers for the
  // worker dropdown (the backend requires the worker to be assigned).
  async function handleAddEntryProjectChange(projectId: number | "") {
    setAddEntryProjectId(projectId);
    setAddEntryWorkerId("");
    setAddEntryProjectWorkers([]);
    if (!projectId) return;
    setAddEntryWorkersLoading(true);
    try {
      setAddEntryProjectWorkers(await projectsApi.getWorkers(projectId));
    } catch {
      setAddEntryProjectWorkers([]);
    } finally {
      setAddEntryWorkersLoading(false);
    }
  }

  async function handleAddEntry() {
    if (!addEntryProjectId || !addEntryWorkerId) return;
    const startIso = fromLocalDateTimeValue(addEntryStart);
    const endIso = fromLocalDateTimeValue(addEntryEnd);
    if (!startIso || !endIso) {
      setEntryError(t("addEntryErrorTimesRequired"));
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      setEntryError(t("addEntryErrorEndBeforeStart"));
      return;
    }

    setEntrySubmitting(true);
    setEntryError(null);
    try {
      await timeTrackingApi.create(addEntryProjectId, {
        workerId: addEntryWorkerId,
        startTime: startIso,
        endTime: endIso,
      });
      setShowAddEntryModal(false);
      await loadData();
    } catch (err) {
      setEntryError(getErrorMessage(err));
    } finally {
      setEntrySubmitting(false);
    }
  }

  function openEditEntryModal(entry: TimeEntryResponse) {
    setEditingEntry(entry);
    setEditStart(toLocalDateTimeValue(parseDate(entry.startTime)));
    setEditEnd(toLocalDateTimeValue(parseDate(entry.endTime)));
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editingEntry) return;
    const startIso = fromLocalDateTimeValue(editStart);
    const endIso = fromLocalDateTimeValue(editEnd);
    if (!startIso || !endIso) {
      setEditError(t("addEntryErrorTimesRequired"));
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      setEditError(t("addEntryErrorEndBeforeStart"));
      return;
    }

    setEntryEditSubmitting(true);
    setEntryEditError(null);
    try {
      await timeTrackingApi.update(editingEntry.id, {
        startTime: startIso,
        endTime: endIso,
      });
      setEditingEntry(null);
      await loadData();
    } catch (err) {
      setEntryEditError(getErrorMessage(err));
    } finally {
      setEntryEditSubmitting(false);
    }
  }

  async function handleDeleteEntry() {
    if (!editingEntry) return;
    const confirmed = window.confirm(t("editEntryDeleteConfirm"));
    if (!confirmed) return;

    setEntryEditSubmitting(true);
    setEntryEditError(null);
    try {
      await timeTrackingApi.delete(editingEntry.id);
      setEditingEntry(null);
      await loadData();
    } catch (err) {
      setEntryEditError(getErrorMessage(err));
    } finally {
      setEntryEditSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState label={t("workplaceLoading")} />;
  }

  if (error || !workplace) {
    if (noAccess) {
      return (
        <div className="card">
          <EmptyState
            icon={<IconMapPin />}
            title={t("workplaceNoAccessTitle")}
            description={t("workplaceNoAccessDesc")}
            actions={
              <button className="btn btn-secondary" onClick={onBack}>
                {t("backToDashboard")}
              </button>
            }
          />
        </div>
      );
    }
    return (
      <div className="card">
        <Alert>{error || t("workplaceNotFound")}</Alert>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onBack}>
            {t("backToDashboard")}
          </button>
        </div>
      </div>
    );
  }

  // Managers can narrow the view to a single member. This only filters the
  // already-authorized data for display — authorization stays on the backend.
  const visibleEntries =
    isManager && selectedMember !== "all"
      ? timeEntries.filter((e) => e.workerId === selectedMember)
      : timeEntries;

  // Only completed (stopped) entries count toward totals.
  const completedEntries = visibleEntries.filter((e) => e.endTime);

  // Backend-computed worked rows, narrowed by the manager member filter just
  // like the entries above. Each row is one user's total for one day with
  // company rules (lunch) already applied — no frontend math.
  const visibleWorkedRows =
    isManager && selectedMember !== "all"
      ? timeWorked.filter((row) => row.userId === selectedMember)
      : timeWorked;

  // Days that have at least one logged entry (red on the calendar).
  const workedDays = new Set(visibleWorkedRows.map((row) => row.date));

  // Total worked within the currently displayed calendar month.
  const monthTotalSeconds = workedSecondsInMonth(
    visibleWorkedRows,
    viewYear,
    viewMonth
  );

  // Entries for the currently selected date only.
  const selectedEntries = completedEntries.filter(
    (e) => toDateKey(new Date(e.startTime)) === selectedDate
  );
  // Total worked for the selected day.
  const selectedTotalSeconds = workedSecondsForDate(
    visibleWorkedRows,
    selectedDate
  );

  const showWorkerColumn = isManager && selectedMember === "all";
  const memberNameById = new Map(
    members.map((m) => [m.id, `${m.name} ${m.lastname}`])
  );
  const projectNameById = new Map(projects.map((p) => [p.id, p.projectName]));

  // The current user's running timer within this workplace (if any).
  const myRunningEntry =
    timeEntries.find((e) => !e.endTime && (!user || e.workerId === user.id)) ||
    null;

  return (
    <div className="page-container page-container--compact">
      <div className="page-header">
        <div>
          <div className="topbar-breadcrumb" style={{ marginBottom: 4 }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
            >
              {t("dashboardTitle")}
            </a>{" "}
            / {workplace.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <h1 className="page-header-title" style={{ margin: 0 }}>
              {workplace.name}
            </h1>
            {isManager && (
              <>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginLeft: "auto" }}
                  onClick={openEditWorkplaceModal}
                >
                  <IconMapPin />
                  {t("edit")}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteWorkplace}
                  disabled={workplaceDeleting}
                >
                  <IconTrash />
                  {workplaceDeleting ? t("deleting") : t("deleteWorkplace")}
                </button>
              </>
            )}
          </div>
          <p className="page-header-subtitle">
            {company?.name || t("companyFallback")} ·{" "}
            {workplace.location?.city || t("noLocationSet")}
          </p>
        </div>
      </div>

      {workplaceDeleteError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <Alert>{workplaceDeleteError}</Alert>
        </div>
      )}

      {timerError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <Alert>{timerError}</Alert>
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "var(--color-primary-soft)",
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconMapPin />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {workplace.name}
            </div>
            <div className="muted small">
              {workplace.location?.city
                ? `${workplace.location.city}${
                    workplace.location.address
                      ? `, ${workplace.location.address}`
                      : ""
                  }`
                : t("noLocationSet")}
            </div>
          </div>
          <div style={{ marginLeft: "auto", flexShrink: 0 }}>
            {myRunningEntry ? (
              <button
                className="btn btn-danger"
                onClick={handleStopTimer}
                disabled={timerActionLoading}
              >
                <IconStop />
                {timerActionLoading
                  ? t("projectStopping")
                  : t("projectStopTimer")}
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleStartTimerClick}
                disabled={
                  timerActionLoading || locating || projects.length === 0
                }
              >
                <IconPlay />
                {locating
                  ? t("projectCheckingLocation")
                  : t("projectStartTimer")}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2>{t("projectsTitle")}</h2>
        {isManager && (
          <div className="section-header-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreateProject(true)}
            >
              <IconPlus />
              {t("projectsCreateProject")}
            </button>
          </div>
        )}
      </div>

      {projectDeleteError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <Alert>{projectDeleteError}</Alert>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconFolder />}
            title={t("projectsNoProjectsTitle")}
            description={t("projectsNoProjectsDesc")}
            actions={
              isManager ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateProject(true)}
                >
                  <IconPlus />
                  {t("projectsCreateProject")}
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="card table-scroll" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t("colProject")}</th>
                <th>{t("colStatus")}</th>
                <th>{t("colStartDate")}</th>
                <th>{t("colDeadline")}</th>
                <th style={{ textAlign: "right" }}>{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onOpenProject(project.id)}
                >
                  <td style={{ fontWeight: 500 }}>{project.projectName}</td>
                  <td>
                    <StatusBadge status={project.projectStatus} />
                  </td>
                  <td>{formatDate(project.startDate, language)}</td>
                  <td>{formatDate(project.deadline, language)}</td>
                  <td style={{ textAlign: "right" }}>
                    {isManager ? (
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditProjectModal(project);
                          }}
                          title={t("editProjectTitle")}
                        >
                          {t("edit")}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project);
                          }}
                          disabled={projectDeletingId === project.id}
                          title={t("deleteProjectTitle")}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    ) : (
                      <IconChevronRight />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ marginBottom: 16 }}>{t("timeTrackingTitle")}</h2>

      <div className="grid" style={{ alignItems: "start" }}>
        <div className="card calendar-card" style={{ marginBottom: 24 }}>
          {isManager && (
            <div style={{ marginBottom: 12 }}>
              <MemberSelect
                members={members}
                value={selectedMember}
                onChange={setSelectedMember}
              />
            </div>
          )}

          <MonthCalendar
            viewYear={viewYear}
            viewMonth={viewMonth}
            onPrevMonth={goToPrevMonth}
            onNextMonth={goToNextMonth}
            workedDays={workedDays}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            monthTotalSeconds={monthTotalSeconds}
          />
        </div>

        {/* Selected day entries (now under the calendar) */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0 }}>
              {formatMonthDay(selectedDate, language)}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {selectedEntries.length > 0 && (
                <span className="badge badge-primary">
                  {t("loggedSuffix", {
                    time: formatDurationHuman(selectedTotalSeconds, language),
                  })}
                </span>
              )}
              {isManager && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={openAddEntryModal}
                >
                  <IconPlus />
                  {t("projectLogTime")}
                </button>
              )}
            </div>
          </div>

          {selectedEntries.length === 0 ? (
            <div className="card" style={{ marginBottom: 24 }}>
              <EmptyState
                icon={<IconClock />}
                title={t("timeTrackingNoEntriesTitle")}
                description={t("timeTrackingNoEntriesDesc")}
              />
            </div>
          ) : (
            <div
              className="card table-scroll"
              style={{ padding: 0, marginBottom: 24 }}
            >
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("colStart")}</th>
                    <th>{t("colEnd")}</th>
                    <th>{t("colWorked")}</th>
                    <th>{t("colProject")}</th>
                    {showWorkerColumn && <th>{t("colWorker")}</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      style={{ cursor: isManager ? "pointer" : "default" }}
                      onClick={
                        isManager ? () => openEditEntryModal(entry) : undefined
                      }
                    >
                      <td>{formatTime(entry.startTime, language)}</td>
                      <td>{formatTime(entry.endTime, language)}</td>
                      <td style={{ fontWeight: 500 }}>
                        {formatDuration(
                          durationToSeconds(entry.duration),
                          language
                        )}
                      </td>
                      <td className="muted">
                        {projectNameById.get(entry.projectId) ?? "—"}
                      </td>
                      {showWorkerColumn && (
                        <td className="muted">
                          {memberNameById.get(entry.workerId) ?? "—"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      colSpan={showWorkerColumn ? 4 : 3}
                      style={{ fontWeight: 600 }}
                    >
                      {t("colTotal")}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {formatDurationHuman(selectedTotalSeconds, language)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {showStartTimerModal && (
        <Modal
          title={t("projectStartTimer")}
          description={t("workplaceStartTimerDesc")}
          onClose={() => setShowStartTimerModal(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowStartTimerModal(false)}
                disabled={timerActionLoading || locating}
              >
                {t("cancel")}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (startTimerProjectId) {
                    const projectId = startTimerProjectId;
                    setShowStartTimerModal(false);
                    void beginStartTimer(projectId);
                  }
                }}
                disabled={
                  timerActionLoading || locating || !startTimerProjectId
                }
              >
                {locating
                  ? t("projectCheckingLocation")
                  : t("projectStartTimer")}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label" htmlFor="start-timer-project">
              {t("colProject")}
            </label>
            <select
              id="start-timer-project"
              className="form-input"
              value={startTimerProjectId}
              onChange={(e) => setStartTimerProjectId(Number(e.target.value))}
              disabled={timerActionLoading || locating}
            >
              <option value="">{t("workplaceProjectPlaceholder")}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName}
                </option>
              ))}
            </select>
          </div>
        </Modal>
      )}

      {clockInPrompt && (
        <ClockInModal
          workplace={workplace}
          position={clockInPrompt.position}
          onClose={() => setClockInPrompt(null)}
          onConfirm={() => {
            const { projectId, position } = clockInPrompt;
            setClockInPrompt(null);
            void startTimer(projectId, position);
          }}
        />
      )}

      {showAddEntryModal && (
        <Modal
          title={t("addEntryTitle")}
          description={t("workplaceAddEntryDesc", {
            date: formatMonthDay(selectedDate, language),
          })}
          onClose={() => {
            setShowAddEntryModal(false);
            setEntryError(null);
          }}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddEntryModal(false);
                  setEntryError(null);
                }}
                disabled={entrySubmitting}
              >
                {t("cancel")}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddEntry}
                disabled={
                  entrySubmitting || !addEntryProjectId || !addEntryWorkerId
                }
              >
                {entrySubmitting
                  ? t("addEntrySubmitting")
                  : t("addEntrySubmit")}
              </button>
            </>
          }
        >
          {entryError && (
            <div style={{ marginBottom: 16 }}>
              <Alert>{entryError}</Alert>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="add-entry-project">
                {t("colProject")}
              </label>
              <select
                id="add-entry-project"
                className="form-input"
                value={
                  addEntryProjectId === "" ? "" : String(addEntryProjectId)
                }
                onChange={(e) =>
                  void handleAddEntryProjectChange(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                disabled={entrySubmitting}
              >
                <option value="" disabled>
                  {t("workplaceProjectPlaceholder")}
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="add-entry-worker">
                {t("addEntryWorkerLabel")}
              </label>
              <select
                id="add-entry-worker"
                className="form-input"
                value={addEntryWorkerId === "" ? "" : String(addEntryWorkerId)}
                onChange={(e) =>
                  setAddEntryWorkerId(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                disabled={
                  entrySubmitting ||
                  !addEntryProjectId ||
                  addEntryWorkersLoading
                }
              >
                <option value="" disabled>
                  {t("addEntryWorkerPlaceholder")}
                </option>
                {addEntryProjectWorkers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} {worker.lastname}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="add-entry-start">
                {t("addEntryStartLabel")}
              </label>
              <input
                id="add-entry-start"
                type="datetime-local"
                className="form-input"
                value={addEntryStart}
                onChange={(e) => setAddEntryStart(e.target.value)}
                disabled={entrySubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="add-entry-end">
                {t("addEntryEndLabel")}
              </label>
              <input
                id="add-entry-end"
                type="datetime-local"
                className="form-input"
                value={addEntryEnd}
                onChange={(e) => setAddEntryEnd(e.target.value)}
                disabled={entrySubmitting}
              />
            </div>
          </div>
        </Modal>
      )}

      {editingEntry && (
        <Modal
          title={t("editEntryTitle")}
          description={
            editingEntry.endTime
              ? t("editEntryTimeRange", {
                  start: formatDateTime(editingEntry.startTime, language),
                  end: formatDateTime(editingEntry.endTime, language),
                })
              : t("editEntryRunningWarning")
          }
          onClose={() => setEditingEntry(null)}
          footer={
            <>
              <button
                className="btn btn-danger"
                onClick={handleDeleteEntry}
                disabled={entryEditSubmitting}
              >
                {entryEditSubmitting
                  ? t("editEntryDeleting")
                  : t("editEntryDelete")}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setEditingEntry(null)}
                disabled={entryEditSubmitting}
              >
                {t("cancel")}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveEdit}
                disabled={entryEditSubmitting || !editingEntry.endTime}
              >
                {entryEditSubmitting
                  ? t("editEntrySubmitting")
                  : t("editEntrySubmit")}
              </button>
            </>
          }
        >
          {entryEditError && (
            <div style={{ marginBottom: 16 }}>
              <Alert>{entryEditError}</Alert>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-start">
                  {t("addEntryStartLabel")}
                </label>
                <input
                  id="edit-start"
                  type="datetime-local"
                  className="form-input"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  disabled={entryEditSubmitting || !editingEntry.endTime}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-end">
                  {t("addEntryEndLabel")}
                </label>
                <input
                  id="edit-end"
                  type="datetime-local"
                  className="form-input"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  disabled={entryEditSubmitting || !editingEntry.endTime}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showEditWorkplace && (
        <Modal
          title={t("editWorkplaceTitle")}
          description={t("editWorkplaceDesc")}
          onClose={() => setShowEditWorkplace(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditWorkplace(false)}
                disabled={editSubmitting}
              >
                {t("cancel")}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveWorkplace}
                disabled={editSubmitting}
              >
                {editSubmitting
                  ? t("editCompanySubmitting")
                  : t("editCompanySubmit")}
              </button>
            </>
          }
        >
          {editError && (
            <div style={{ marginBottom: 16 }}>
              <Alert>{editError}</Alert>
            </div>
          )}
          <form onSubmit={handleSaveWorkplace}>
            <div className="form-group">
              <label className="form-label" htmlFor="workplace-name">
                {t("createWorkplaceNameLabel")}
              </label>
              <input
                id="workplace-name"
                type="text"
                className="form-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={editSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("editWorkplaceLocationLabel")}
              </label>
              <MapPicker
                value={editLocation}
                onChange={setEditLocation}
                radiusMeters={editRadius}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="workplace-radius">
                {t("editWorkplaceRadiusLabel").replace(
                  "{radius}",
                  String(editRadius)
                )}
              </label>
              <input
                id="workplace-radius"
                type="range"
                min={50}
                max={2000}
                step={10}
                className="form-input"
                value={editRadius}
                onChange={(e) => setEditRadius(Number(e.target.value))}
                disabled={editSubmitting}
              />
              <div className="muted small">{t("editWorkplaceRadiusDesc")}</div>
            </div>
          </form>
        </Modal>
      )}

      {showCreateProject && (
        <Modal
          title={t("createProjectTitle")}
          description={t("createProjectDesc").replace("{name}", workplace.name)}
          onClose={() => setShowCreateProject(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateProject(false)}
                disabled={projectSubmitting}
              >
                {t("cancel")}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateProject}
                disabled={projectSubmitting}
              >
                {projectSubmitting
                  ? t("createProjectSubmitting")
                  : t("createProjectSubmit")}
              </button>
            </>
          }
        >
          {projectError && (
            <div style={{ marginBottom: 16 }}>
              <Alert>{projectError}</Alert>
            </div>
          )}
          <form onSubmit={handleCreateProject}>
            <div className="form-group">
              <label className="form-label" htmlFor="project-name">
                {t("createProjectNameLabel")}
              </label>
              <input
                id="project-name"
                type="text"
                className="form-input"
                placeholder={t("createProjectNamePlaceholder")}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={projectSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="project-start">
                {t("colStartDate")}
              </label>
              <input
                id="project-start"
                type="date"
                className="form-input"
                value={projectStartDate}
                onChange={(e) => setProjectStartDate(e.target.value)}
                disabled={projectSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="project-deadline">
                {t("colDeadline")}
              </label>
              <input
                id="project-deadline"
                type="date"
                className="form-input"
                value={projectDeadline}
                onChange={(e) => setProjectDeadline(e.target.value)}
                disabled={projectSubmitting}
              />
            </div>
          </form>
        </Modal>
      )}

      {showEditProject && (
        <Modal
          title={t("editProjectTitle")}
          description={t("editProjectDesc").replace(
            "{name}",
            editProjectName || t("projectFallback")
          )}
          onClose={() => setShowEditProject(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditProject(false)}
                disabled={editProjectSubmitting}
              >
                {t("cancel")}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEditProject}
                disabled={editProjectSubmitting}
              >
                {editProjectSubmitting
                  ? t("editCompanySubmitting")
                  : t("editCompanySubmit")}
              </button>
            </>
          }
        >
          {editProjectError && (
            <div style={{ marginBottom: 16 }}>
              <Alert>{editProjectError}</Alert>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditProject();
            }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="edit-project-name">
                {t("createProjectNameLabel")}
              </label>
              <input
                id="edit-project-name"
                type="text"
                className="form-input"
                placeholder={t("createProjectNamePlaceholder")}
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                disabled={editProjectSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-project-start">
                {t("colStartDate")}
              </label>
              <input
                id="edit-project-start"
                type="date"
                className="form-input"
                value={editProjectStartDate}
                onChange={(e) => setEditProjectStartDate(e.target.value)}
                disabled={editProjectSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-project-deadline">
                {t("colDeadline")}
              </label>
              <input
                id="edit-project-deadline"
                type="date"
                className="form-input"
                value={editProjectDeadline}
                onChange={(e) => setEditProjectDeadline(e.target.value)}
                disabled={editProjectSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("colStatus")}</label>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {PROJECT_STATUSES.map((status) => (
                  <label
                    key={status}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: editProjectSubmitting ? "not-allowed" : "pointer",
                      padding: "6px 8px",
                      borderRadius: 8,
                      border:
                        editProjectStatus === status
                          ? "1px solid var(--color-primary)"
                          : "1px solid transparent",
                    }}
                  >
                    <input
                      type="radio"
                      name="edit-project-status"
                      checked={editProjectStatus === status}
                      onChange={() => setEditProjectStatus(status)}
                      disabled={editProjectSubmitting}
                    />
                    <StatusBadge status={status} />
                  </label>
                ))}
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
