import { useCallback, useEffect, useRef, useState } from "react";
import {
  companiesApi,
  getErrorMessage,
  projectsApi,
  timeTrackingApi,
  workplacesApi,
} from "../api";
import ClockInModal from "../ClockInModal";
import type {
  ProjectResponse,
  ProjectStatus,
  TimeEntryLogStatus,
  TimeEntryResponse,
  UserResponse,
  WorkplaceResponse,
} from "../types";
import { useAuth } from "../auth";
import type { MemberFilterValue } from "../components";
import {
  Alert,
  EmptyState,
  IconClock,
  IconPlay,
  IconPlus,
  IconStop,
  IconTrash,
  IconUsers,
  LoadingState,
  MemberSelect,
  Modal,
  MonthCalendar,
  StatusBadge,
} from "../components";
import {
  distanceMeters,
  effectiveDurationSeconds,
  elapsedSecondsFrom,
  formatDate,
  formatDateTime,
  formatDuration,
  formatDurationHuman,
  formatMonthDay,
  formatTime,
  formatTimer,
  fromLocalDateTimeValue,
  getBrowserPosition,
  getInitials,
  parseDate,
  toDateKey,
  toLocalDateTimeValue,
} from "../utils";

interface ProjectPageProps {
  projectId: number;
  onBack: () => void;
}

/** Small colored badge describing how a time entry was logged. */
function TimeEntryStatusBadge({ status }: { status: TimeEntryLogStatus }) {
  const meta: Record<
    TimeEntryLogStatus,
    { label: string; color: string; background: string }
  > = {
    LOGGED: { label: "Logged", color: "#2f7d32", background: "#e6f4ea" },
    LOGGED_OUTSIDE: {
      label: "Outside",
      color: "#b45309",
      background: "#fdf1e0",
    },
    MANUAL_ENTRY: { label: "Manual", color: "#1d4ed8", background: "#e7edfd" },
    EDITED: { label: "Edited", color: "#6d28d9", background: "#f1eafe" },
  };
  const { label, color, background } = meta[status];
  return (
    <span className="badge" style={{ color, background, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

// Mirrors the backend ProjectStatus enum.
const PROJECT_STATUSES: ProjectStatus[] = [
  "PENDING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
  "ON_HOLD",
];

export default function ProjectPage({ projectId, onBack }: ProjectPageProps) {
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [workplace, setWorkplace] = useState<WorkplaceResponse | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manager member filter ("all" or a user id) — managers only.
  const [members, setMembers] = useState<UserResponse[]>([]);
  const [selectedMember, setSelectedMember] =
    useState<MemberFilterValue>("all");

  // Calendar state
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(today));

  // Timer state
  const [activeEntry, setActiveEntry] = useState<TimeEntryResponse | null>(
    null
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActionLoading, setTimerActionLoading] = useState(false);
  const [timerError, setTimerError] = useState<string | null>(null);
  const tickRef = useRef<number | null>(null);

  // Clock-in flow state: the Start button locates the worker first; when
  // they appear to be outside the work area, the confirmation popup opens.
  const [locating, setLocating] = useState(false);
  const [clockInPrompt, setClockInPrompt] = useState<{
    position: { latitude: number; longitude: number } | null;
  } | null>(null);

  // Status state
  const [isManager, setIsManager] = useState(false);

  // Project workers state
  const [workers, setWorkers] = useState<UserResponse[]>([]);
  // Former company members (kicked) — merged into name resolution so their
  // historical entries show real names instead of "—". Managers only.
  const [formerMembers, setFormerMembers] = useState<UserResponse[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignWorkerId, setAssignWorkerId] = useState<number | "">("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Edit project modal (managers only)
  const [showEditProject, setShowEditProject] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectStartDate, setEditProjectStartDate] = useState("");
  const [editProjectDeadline, setEditProjectDeadline] = useState("");
  const [editProjectStatus, setEditProjectStatus] =
    useState<ProjectStatus>("ACTIVE");
  const [editProjectSubmitting, setEditProjectSubmitting] = useState(false);
  const [editProjectError, setEditProjectError] = useState<string | null>(null);

  // Delete project (managers only)
  const [projectDeleting, setProjectDeleting] = useState(false);
  const [projectDeleteError, setProjectDeleteError] = useState<string | null>(
    null
  );

  // Manager add-entry modal state
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [addEntryWorkerId, setAddEntryWorkerId] = useState<number | "">("");
  const [addEntryStart, setAddEntryStart] = useState("");
  const [addEntryEnd, setAddEntryEnd] = useState("");
  const [addEntryLunchLength, setAddEntryLunchLength] = useState(30);
  const [entrySubmitting, setEntrySubmitting] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Manager edit/delete modal state
  const [editingEntry, setEditingEntry] = useState<TimeEntryResponse | null>(
    null
  );
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editLunchLength, setEditLunchLength] = useState(30);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Entries scoped to this project by the backend (managers get
      // everyone's entries, regular members get only their own).
      const [proj, entries, workerList] = await Promise.all([
        projectsApi.get(projectId),
        timeTrackingApi.getByProject(projectId),
        projectsApi.getWorkers(projectId),
      ]);
      setProject(proj);
      setTimeEntries(entries);
      setWorkers(workerList);

      // Check if there's an active (running) entry of the current user
      // among this project's entries.
      const running = entries.find(
        (e) => !e.endTime && (!user || e.workerId === user.id)
      );
      setActiveEntry(running || null);
      setElapsedSeconds(elapsedSecondsFrom(running?.startTime ?? null));

      if (proj.workplaceId) {
        const wp = await workplacesApi.get(proj.workplaceId);
        setWorkplace(wp);

        // Determine whether the current user may manage this project and
        // load the company members for the manager filter dropdown.
        if (wp.companyId && user) {
          try {
            const memberList = await companiesApi.getMembers(wp.companyId);
            const me = memberList.find((m) => m.id === user.id);
            setIsManager(me?.companyRole === "MANAGER");
            setMembers(memberList);

            if (me?.companyRole === "MANAGER") {
              try {
                setFormerMembers(await companiesApi.getFormerMembers());
              } catch {
                setFormerMembers([]);
              }
            }
          } catch {
            setIsManager(false);
            setMembers([]);
          }
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset the member filter when switching projects.
  useEffect(() => {
    setSelectedMember("all");
  }, [projectId]);

  // Timer tick — updates elapsed time every second while a timer is running
  useEffect(() => {
    if (activeEntry) {
      tickRef.current = window.setInterval(() => {
        setElapsedSeconds(elapsedSecondsFrom(activeEntry.startTime));
      }, 1000);
    }

    return () => {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [activeEntry]);

  async function startTimer(
    coords: { latitude: number; longitude: number } | null
  ) {
    setTimerActionLoading(true);
    try {
      const entry = await timeTrackingApi.start(projectId, {
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      });
      setActiveEntry(entry);
      setElapsedSeconds(0);
      if (entry.status === "LOGGED_OUTSIDE") {
        setTimerError(
          "Timer started outside the work area — this entry is flagged as logged outside."
        );
      }
      void loadData();
    } catch (err) {
      setTimerError(getErrorMessage(err));
    } finally {
      setTimerActionLoading(false);
    }
  }

  /**
   * "Start timer" click flow:
   * 1. Ask the browser for the current position (permission prompt on click).
   * 2. Inside the work area (or workplace without location) → start silently,
   *    no popup.
   * 3. Outside / location unavailable → open the confirmation popup with the
   *    map; the timer only starts after "Start timer anyway".
   */
  async function handleStartTimer() {
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
        await startTimer(position);
      } else {
        // Stay "locating" (button disabled) while the popup is open.
        setClockInPrompt({ position });
      }
    } finally {
      setLocating(false);
    }
  }

  async function handleStopTimer() {
    if (!activeEntry) return;
    setTimerError(null);
    setTimerActionLoading(true);
    try {
      const stopped = await timeTrackingApi.stop(activeEntry.id);
      setActiveEntry(null);
      setElapsedSeconds(0);

      // Refresh the data so the calendar marks the day and the list updates.
      await loadData();

      // If the stopped entry's day is currently selected, show it immediately.
      const dayKey = stopped.endTime
        ? toDateKey(new Date(stopped.endTime))
        : null;
      if (dayKey) {
        setSelectedDate(dayKey);
        setViewYear(new Date(dayKey).getFullYear());
        setViewMonth(new Date(dayKey).getMonth());
      }
    } catch (err) {
      setTimerError(getErrorMessage(err));
    } finally {
      setTimerActionLoading(false);
    }
  }

  function openEditProjectModal() {
    setEditProjectName(project?.projectName ?? "");
    setEditProjectStartDate(project?.startDate ?? "");
    setEditProjectDeadline(project?.deadline ?? "");
    setEditProjectStatus(project?.projectStatus ?? "ACTIVE");
    setEditProjectError(null);
    setShowEditProject(true);
  }

  async function handleEditProject() {
    if (!project) return;
    setEditProjectSubmitting(true);
    setEditProjectError(null);
    try {
      const updated = await projectsApi.update(project.id, {
        projectName: editProjectName,
        startDate: editProjectStartDate || null,
        deadline: editProjectDeadline || null,
        projectStatus: editProjectStatus,
      });
      setProject(updated);
      setShowEditProject(false);
    } catch (err) {
      setEditProjectError(getErrorMessage(err));
    } finally {
      setEditProjectSubmitting(false);
    }
  }

  async function handleDeleteProject() {
    if (!project) return;
    const confirmed = window.confirm(
      `Delete "${project.projectName}"? This will permanently remove the project and all of its time entries.`
    );
    if (!confirmed) return;

    setProjectDeleteError(null);
    setProjectDeleting(true);
    try {
      await projectsApi.delete(project.id);
      onBack();
    } catch (err) {
      setProjectDeleteError(getErrorMessage(err));
    } finally {
      setProjectDeleting(false);
    }
  }

  async function handleAssignWorker() {
    if (!project || !assignWorkerId) return;
    setAssignSubmitting(true);
    setAssignError(null);
    try {
      await projectsApi.assignWorker(project.id, assignWorkerId);
      setShowAssignModal(false);
      setAssignWorkerId("");
      await loadData();
    } catch (err) {
      setAssignError(getErrorMessage(err));
    } finally {
      setAssignSubmitting(false);
    }
  }

  async function handleRemoveWorker(worker: UserResponse) {
    if (!project) return;
    const confirmed = window.confirm(
      `Remove ${worker.name} ${worker.lastname} from ${project.projectName}?`
    );
    if (!confirmed) return;

    try {
      await projectsApi.removeWorker(project.id, worker.id);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function openAddEntryModal() {
    setAddEntryWorkerId("");
    setAddEntryStart(`${selectedDate}T07:30`);
    setAddEntryEnd(`${selectedDate}T16:30`);
    setAddEntryLunchLength(30);
    setEntryError(null);
    setShowAddEntryModal(true);
  }

  async function handleAddEntry() {
    if (!project || !addEntryWorkerId) return;
    const startIso = fromLocalDateTimeValue(addEntryStart);
    const endIso = fromLocalDateTimeValue(addEntryEnd);
    if (!startIso || !endIso) {
      setEntryError("Please provide both start and end times.");
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      setEntryError("End time must be after start time.");
      return;
    }
    if (addEntryLunchLength < 0) {
      setEntryError("Lunch length cannot be negative.");
      return;
    }

    setEntrySubmitting(true);
    setEntryError(null);
    try {
      await timeTrackingApi.create(project.id, {
        workerId: addEntryWorkerId,
        startTime: startIso,
        endTime: endIso,
        lunchLength: addEntryLunchLength,
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
    setEditLunchLength(entry.lunchLength ?? 30);
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editingEntry) return;
    const startIso = fromLocalDateTimeValue(editStart);
    const endIso = fromLocalDateTimeValue(editEnd);
    if (!startIso || !endIso) {
      setEditError("Please provide both start and end times.");
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      setEditError("End time must be after start time.");
      return;
    }
    if (editLunchLength < 0) {
      setEditError("Lunch length cannot be negative.");
      return;
    }

    setEditSubmitting(true);
    setEditError(null);
    try {
      await timeTrackingApi.update(editingEntry.id, {
        startTime: startIso,
        endTime: endIso,
        lunchLength: editLunchLength,
      });
      setEditingEntry(null);
      await loadData();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDeleteEntry() {
    if (!editingEntry) return;
    const confirmed = window.confirm("Delete this time entry?");
    if (!confirmed) return;

    setEditSubmitting(true);
    setEditError(null);
    try {
      await timeTrackingApi.delete(editingEntry.id);
      setEditingEntry(null);
      await loadData();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setEditSubmitting(false);
    }
  }

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

  if (loading) {
    return <LoadingState label="Loading project…" />;
  }

  if (error || !project) {
    return (
      <div className="card">
        <Alert>{error || "Project not found."}</Alert>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onBack}>
            Back
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

  // Days that have at least one logged entry (red on the calendar).
  const workedDays = new Set(
    completedEntries.map((e) => toDateKey(new Date(e.startTime)))
  );

  // Total worked within the currently displayed calendar month.
  const monthTotalSeconds = completedEntries
    .filter((e) => {
      const d = new Date(e.startTime);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    })
    .reduce(
      (sum, entry) =>
        sum + effectiveDurationSeconds(entry.duration, entry.lunchLength),
      0
    );

  // Entries for the currently selected date only.
  const selectedEntries = completedEntries.filter(
    (e) => toDateKey(new Date(e.startTime)) === selectedDate
  );
  const selectedTotalSeconds = selectedEntries.reduce(
    (sum, entry) =>
      sum + effectiveDurationSeconds(entry.duration, entry.lunchLength),
    0
  );

  const showWorkerColumn = isManager && selectedMember === "all";
  // Resolve worker names from the full company member list (plus the project's
  // worker list as a fallback) so removed workers with historical entries still
  // render their names in the time entry table.
  const workerNameById = new Map(
    [...members, ...workers, ...formerMembers].map(
      (w) => [w.id, `${w.name} ${w.lastname}`] as const
    )
  );

  // Company members that are not yet assigned to this project.
  const assignableMembers = members.filter(
    (m) => !workers.some((w) => w.id === m.id)
  );

  // Members the calendar filter can narrow by: actively assigned workers plus
  // anyone with historical time entries in this project (incl. removed workers).
  // Resolved from the company member list so inactive workers' names show up.
  const filterableMemberIds = new Set<number>([
    ...workers.map((w) => w.id),
    ...timeEntries.map((e) => e.workerId),
  ]);
  const filterMembers = members.filter((m) => filterableMemberIds.has(m.id));

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
              {workplace?.name || "Workplace"}
            </a>{" "}
            / {project.projectName}
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
              {project.projectName}
            </h1>
            <StatusBadge status={project.projectStatus} />
            {isManager && (
              <>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginLeft: "auto" }}
                  onClick={openEditProjectModal}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteProject}
                  disabled={projectDeleting}
                >
                  <IconTrash />
                  {projectDeleting ? "Deleting…" : "Delete"}
                </button>
              </>
            )}
          </div>
          <p className="page-header-subtitle">
            {workplace?.name || "Workplace"} · Started{" "}
            {formatDate(project.startDate)}
            {project.deadline
              ? ` · Deadline ${formatDate(project.deadline)}`
              : ""}
          </p>
        </div>
      </div>

      {projectDeleteError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <Alert>{projectDeleteError}</Alert>
        </div>
      )}

      {/* Workers */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ margin: 0 }}>Workers</h3>
          {isManager && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setAssignWorkerId("");
                setAssignError(null);
                setShowAssignModal(true);
              }}
            >
              <IconPlus />
              Assign worker
            </button>
          )}
        </div>

        {workers.length === 0 ? (
          <EmptyState
            icon={<IconUsers />}
            title="No workers assigned yet."
            description="Assign company members to this project so they can track time on it."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {workers.map((worker) => (
              <div
                key={worker.id}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <div
                  className="topbar-avatar"
                  aria-hidden="true"
                  style={{ flexShrink: 0 }}
                >
                  {getInitials(`${worker.name} ${worker.lastname}`)}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {worker.name} {worker.lastname}
                  </div>
                  <div className="muted small">{worker.email}</div>
                </div>
                {isManager && worker.id !== user?.id && (
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ marginLeft: "auto" }}
                    onClick={() => handleRemoveWorker(worker)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="project-timing-panel">
        {/* Timer above the calendar */}
        <div className="card timer-card" style={{ marginBottom: 0 }}>
          <div className="muted small" style={{ marginBottom: 8 }}>
            {activeEntry ? "Currently working" : "No timer running"}
          </div>
          <div className="timer-display" style={{ marginBottom: 20 }}>
            {formatTimer(elapsedSeconds)}
          </div>

          {timerError && (
            <div style={{ marginBottom: 16 }}>
              <Alert>{timerError}</Alert>
            </div>
          )}

          {activeEntry ? (
            <button
              className="btn btn-danger btn-lg"
              onClick={handleStopTimer}
              disabled={timerActionLoading}
            >
              <IconStop />
              {timerActionLoading ? "Stopping…" : "Stop timer"}
            </button>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleStartTimer}
              disabled={timerActionLoading || locating}
            >
              <IconPlay />
              {locating ? "Checking location…" : "Start timer"}
            </button>
          )}
        </div>

        {/* Calendar below timer */}
        <div className="card calendar-card">
          {isManager && (
            <div style={{ marginBottom: 12 }}>
              {/* Active workers plus removed workers who still have entries. */}
              <MemberSelect
                members={filterMembers}
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
      </div>

      {/* Selected day entries */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0 }}>{formatMonthDay(selectedDate)}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {selectedEntries.length > 0 && (
            <span className="badge badge-primary">
              {formatDurationHuman(selectedTotalSeconds)} logged
            </span>
          )}
          {isManager && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={openAddEntryModal}
            >
              <IconPlus />
              Log time
            </button>
          )}
        </div>
      </div>

      {selectedEntries.length === 0 ? (
        <div className="card" style={{ marginBottom: 24 }}>
          <EmptyState
            icon={<IconClock />}
            title="No time logged on this day."
            description="Click any worked day in the calendar to see its entries, or start the timer above to log time for today."
          />
        </div>
      ) : (
        <div
          className="card"
          style={{ padding: 0, overflowX: "auto", marginBottom: 24 }}
        >
          <table className="table">
            <thead>
              <tr>
                <th>Start</th>
                <th>End</th>
                <th>Lunch</th>
                <th>Status</th>
                <th>Worked</th>
                {showWorkerColumn && <th>Worker</th>}
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
                  <td>{formatTime(entry.startTime)}</td>
                  <td>{formatTime(entry.endTime)}</td>
                  <td className="muted">{entry.lunchLength}m</td>
                  <td>
                    <TimeEntryStatusBadge status={entry.status} />
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {formatDuration(
                      effectiveDurationSeconds(
                        entry.duration,
                        entry.lunchLength
                      )
                    )}
                  </td>
                  {showWorkerColumn && (
                    <td className="muted">
                      {workerNameById.get(entry.workerId) ?? "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={showWorkerColumn ? 5 : 4}
                  style={{ fontWeight: 600 }}
                >
                  Total
                </td>
                <td style={{ fontWeight: 700 }}>
                  {formatDurationHuman(selectedTotalSeconds)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {clockInPrompt && (
        <ClockInModal
          workplace={workplace}
          position={clockInPrompt.position}
          onClose={() => setClockInPrompt(null)}
          onConfirm={() => {
            const coords = clockInPrompt.position;
            setClockInPrompt(null);
            void startTimer(coords);
          }}
        />
      )}

      {showAddEntryModal && (
        <Modal
          title="Add time entry"
          description={`Log time for ${formatMonthDay(selectedDate)} on ${
            project.projectName
          }.`}
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
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddEntry}
                disabled={entrySubmitting || !addEntryWorkerId}
              >
                {entrySubmitting ? "Adding…" : "Add entry"}
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
              <label className="form-label" htmlFor="add-entry-worker">
                Worker
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
                disabled={entrySubmitting}
              >
                <option value="" disabled>
                  Select a worker…
                </option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} {worker.lastname}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-project-start">
                Start
              </label>
              <input
                id="edit-project-start"
                type="datetime-local"
                className="form-input"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                disabled={editSubmitting || !editingEntry.endTime}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-project-end">
                End
              </label>
              <input
                id="edit-project-end"
                type="datetime-local"
                className="form-input"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
                disabled={editSubmitting || !editingEntry.endTime}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="add-entry-lunch-length">
                Lunch length (minutes)
              </label>
              <input
                id="add-entry-lunch-length"
                type="number"
                min={0}
                step={5}
                className="form-input"
                value={addEntryLunchLength}
                onChange={(e) =>
                  setAddEntryLunchLength(
                    Number.isFinite(Number(e.target.value))
                      ? Number(e.target.value)
                      : 0
                  )
                }
                disabled={entrySubmitting}
              />
            </div>
          </div>
        </Modal>
      )}

      {editingEntry && (
        <Modal
          title="Edit time entry"
          description={
            editingEntry.endTime
              ? `${formatDateTime(editingEntry.startTime)} → ${formatDateTime(
                  editingEntry.endTime
                )}`
              : "This entry is still running and cannot be edited."
          }
          onClose={() => setEditingEntry(null)}
          footer={
            <>
              <button
                className="btn btn-danger"
                onClick={handleDeleteEntry}
                disabled={editSubmitting}
              >
                {editSubmitting ? "Deleting…" : "Delete"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setEditingEntry(null)}
                disabled={editSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveEdit}
                disabled={editSubmitting || !editingEntry.endTime}
              >
                {editSubmitting ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          {editError && (
            <div style={{ marginBottom: 16 }}>
              <Alert>{editError}</Alert>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-start">
                  Start
                </label>
                <input
                  id="edit-start"
                  type="datetime-local"
                  className="form-input"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  disabled={editSubmitting || !editingEntry.endTime}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-end">
                  End
                </label>
                <input
                  id="edit-end"
                  type="datetime-local"
                  className="form-input"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  disabled={editSubmitting || !editingEntry.endTime}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-lunch-length">
                Lunch length (minutes)
              </label>
              <input
                id="edit-lunch-length"
                type="number"
                min={0}
                step={5}
                className="form-input"
                value={editLunchLength}
                onChange={(e) =>
                  setEditLunchLength(
                    Number.isFinite(Number(e.target.value))
                      ? Number(e.target.value)
                      : 0
                  )
                }
                disabled={editSubmitting || !editingEntry.endTime}
              />
            </div>
          </div>
        </Modal>
      )}

      {showAssignModal && (
        <Modal
          title="Assign worker"
          description={`Add a company member to ${project.projectName}.`}
          onClose={() => {
            setShowAssignModal(false);
            setAssignError(null);
          }}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignError(null);
                }}
                disabled={assignSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssignWorker}
                disabled={assignSubmitting || !assignWorkerId}
              >
                {assignSubmitting ? "Assigning…" : "Assign"}
              </button>
            </>
          }
        >
          {assignError && (
            <div style={{ marginBottom: 16 }}>
              <Alert>{assignError}</Alert>
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="assign-worker">
              Company member
            </label>
            <select
              id="assign-worker"
              className="form-input"
              value={assignWorkerId === "" ? "" : String(assignWorkerId)}
              onChange={(e) =>
                setAssignWorkerId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              disabled={assignSubmitting}
            >
              <option value="" disabled>
                Select a member…
              </option>
              {assignableMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} {member.lastname} (@{member.username})
                </option>
              ))}
            </select>
            {assignableMembers.length === 0 && (
              <div className="muted small" style={{ marginTop: 8 }}>
                All company members are already assigned to this project.
              </div>
            )}
          </div>
        </Modal>
      )}

      {showEditProject && (
        <Modal
          title="Edit project"
          description={`Update details for ${
            editProjectName || "this project"
          }.`}
          onClose={() => setShowEditProject(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditProject(false)}
                disabled={editProjectSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEditProject}
                disabled={editProjectSubmitting}
              >
                {editProjectSubmitting ? "Saving…" : "Save changes"}
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
                Project name
              </label>
              <input
                id="edit-project-name"
                type="text"
                className="form-input"
                placeholder="e.g. Website redesign"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                disabled={editProjectSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-project-start">
                Start date
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
                Deadline
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
              <label className="form-label">Status</label>
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
