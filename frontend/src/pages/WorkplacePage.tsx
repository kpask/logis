import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  companiesApi,
  getErrorMessage,
  isApiError,
  projectsApi,
  timeTrackingApi,
  workplacesApi,
} from "../api";
import MapPicker from "../MapPicker";
import type {
  CompanyResponse,
  Location,
  ProjectResponse,
  ProjectStatus,
  TimeEntryResponse,
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
  IconPlus,
  IconTrash,
  LoadingState,
  MemberSelect,
  Modal,
  MonthCalendar,
  StatusBadge,
} from "../components";
import {
  effectiveDurationSeconds,
  formatDate,
  formatDuration,
  formatDurationHuman,
  formatMonthDay,
  formatTime,
  toDateKey,
} from "../utils";

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
  const [workplace, setWorkplace] = useState<WorkplaceResponse | null>(null);
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noAccess, setNoAccess] = useState(false);

  // Time tracking / calendar state
  const [timeEntries, setTimeEntries] = useState<TimeEntryResponse[]>([]);
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoAccess(false);

    try {
      // Entries scoped to this workplace by the backend (managers get
      // everyone's entries across its projects, regular members get
      // only their own).
      const [wp, proj, entries] = await Promise.all([
        workplacesApi.get(workplaceId),
        workplacesApi.getProjects(workplaceId),
        timeTrackingApi.getByWorkplace(workplaceId),
      ]);
      setWorkplace(wp);
      setProjects(proj);
      setTimeEntries(entries);

      if (wp.companyId) {
        const comp = await companiesApi.get(wp.companyId);
        setCompany(comp);

        // Determine whether the current user is a company manager and
        // load the member list for the manager filter dropdown.
        if (user) {
          try {
            const memberList = await companiesApi.getMembers(wp.companyId);
            const me = memberList.find((m) => m.id === user.id);
            setIsManager(me?.companyRole === "MANAGER");
            setMembers(memberList);
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
      setEditError("Workplace name is required.");
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
      `Delete "${workplace.name}"? This will permanently remove the workplace and all of its projects and time entries.`
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
      setProjectError("Project name is required.");
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
      `Delete "${project.projectName}"? This will permanently remove the project and all of its time entries.`
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

  if (loading) {
    return <LoadingState label="Loading workplace…" />;
  }

  if (error || !workplace) {
    if (noAccess) {
      return (
        <div className="card">
          <EmptyState
            icon={<IconMapPin />}
            title="You don't have access to this workplace."
            description="You're not a member of this workplace. Ask your company manager to add you to it."
            actions={
              <button className="btn btn-secondary" onClick={onBack}>
                Back to dashboard
              </button>
            }
          />
        </div>
      );
    }
    return (
      <div className="card">
        <Alert>{error || "Workplace not found."}</Alert>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onBack}>
            Back to dashboard
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
  const memberNameById = new Map(
    members.map((m) => [m.id, `${m.name} ${m.lastname}`])
  );
  const projectNameById = new Map(projects.map((p) => [p.id, p.projectName]));

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
              Dashboard
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
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteWorkplace}
                  disabled={workplaceDeleting}
                >
                  <IconTrash />
                  {workplaceDeleting ? "Deleting…" : "Delete workplace"}
                </button>
              </>
            )}
          </div>
          <p className="page-header-subtitle">
            {company?.name || "Company"} ·{" "}
            {workplace.location?.city || "No location set"}
          </p>
        </div>
      </div>

      {workplaceDeleteError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <Alert>{workplaceDeleteError}</Alert>
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
                : "No location set"}
            </div>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2>Projects</h2>
        {isManager && (
          <div className="section-header-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreateProject(true)}
            >
              <IconPlus />
              Create project
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
            title="No projects in this workplace yet."
            description="Create a project to start tracking time. If you don't see a create button, ask a company manager to create projects."
            actions={
              isManager ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateProject(true)}
                >
                  <IconPlus />
                  Create project
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
                <th>Project</th>
                <th>Status</th>
                <th>Start date</th>
                <th>Deadline</th>
                <th style={{ textAlign: "right" }}>Actions</th>
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
                  <td>{formatDate(project.startDate)}</td>
                  <td>{formatDate(project.deadline)}</td>
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
                          title="Edit project"
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project);
                          }}
                          disabled={projectDeletingId === project.id}
                          title="Delete project"
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

      <h2 style={{ marginBottom: 16 }}>Time tracking</h2>

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
            <h2 style={{ margin: 0 }}>{formatMonthDay(selectedDate)}</h2>
            {selectedEntries.length > 0 && (
              <span className="badge badge-primary">
                {formatDurationHuman(selectedTotalSeconds)} logged
              </span>
            )}
          </div>

          {selectedEntries.length === 0 ? (
            <div className="card" style={{ marginBottom: 24 }}>
              <EmptyState
                icon={<IconClock />}
                title="No time logged on this day."
                description="Click any worked day in the calendar to see its entries across this workplace's projects."
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
                    <th>Start</th>
                    <th>End</th>
                    <th>Lunch</th>
                    <th>Worked</th>
                    <th>Project</th>
                    {showWorkerColumn && <th>Worker</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatTime(entry.startTime)}</td>
                      <td>{formatTime(entry.endTime)}</td>
                      <td className="muted">{entry.lunchLength}m</td>
                      <td style={{ fontWeight: 500 }}>
                        {formatDuration(
                          effectiveDurationSeconds(
                            entry.duration,
                            entry.lunchLength
                          )
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
        </div>
      </div>

      {showEditWorkplace && (
        <Modal
          title="Edit workplace"
          description="Update the name, location and clock-in fence of this workplace."
          onClose={() => setShowEditWorkplace(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditWorkplace(false)}
                disabled={editSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveWorkplace}
                disabled={editSubmitting}
              >
                {editSubmitting ? "Saving…" : "Save changes"}
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
                Workplace name
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
                Location — click the map or search for the address
              </label>
              <MapPicker
                value={editLocation}
                onChange={setEditLocation}
                radiusMeters={editRadius}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="workplace-radius">
                Clock-in fence radius: <strong>{editRadius} m</strong>
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
              <div className="muted small">
                Workers must be within this distance of the location for their
                time entry to be logged as on-site. Entries outside are still
                allowed but flagged.
              </div>
            </div>
          </form>
        </Modal>
      )}

      {showCreateProject && (
        <Modal
          title="Create project"
          description={`Project in ${workplace.name}`}
          onClose={() => setShowCreateProject(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateProject(false)}
                disabled={projectSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateProject}
                disabled={projectSubmitting}
              >
                {projectSubmitting ? "Creating…" : "Create project"}
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
                Project name
              </label>
              <input
                id="project-name"
                type="text"
                className="form-input"
                placeholder="e.g. Website redesign"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={projectSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="project-start">
                Start date
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
                Deadline
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
