import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import {
  companiesApi,
  getErrorMessage,
  invitationsApi,
  workplacesApi,
} from "../api";
import type {
  CompanyResponse,
  CompanyRole,
  Location,
  UserResponse,
  WorkplaceResponse,
} from "../types";
import {
  Alert,
  EmptyState,
  IconBuilding,
  IconChevronRight,
  IconMapPin,
  IconPlus,
  IconUsers,
  LoadingState,
  Modal,
} from "../components";
import { getInitials } from "../utils";
import MapPicker from "../MapPicker";

function roleBadge(role: CompanyRole | null | undefined) {
  if (role === "MANAGER") {
    return <span className="badge badge-primary">Manager</span>;
  }
  return <span className="badge badge-muted">Worker</span>;
}

interface DashboardPageProps {
  onOpenWorkplace: (workplaceId: number) => void;
}

export default function DashboardPage({ onOpenWorkplace }: DashboardPageProps) {
  const { user, refreshUser } = useAuth();

  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [workplaces, setWorkplaces] = useState<WorkplaceResponse[]>([]);
  const [members, setMembers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create company modal
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companySubmitting, setCompanySubmitting] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  // Create workplace modal
  const [showCreateWorkplace, setShowCreateWorkplace] = useState(false);
  const [workplaceName, setWorkplaceName] = useState("");
  const [workplaceLocation, setWorkplaceLocation] = useState<Location | null>(
    null
  );
  const [workplaceSubmitting, setWorkplaceSubmitting] = useState(false);
  const [workplaceError, setWorkplaceError] = useState<string | null>(null);

  // Invite member modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      // If there's no user yet, ensure loading is cleared so the UI doesn't stay stuck
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (user.companyId) {
        const [companyData, workplaceData, memberData] = await Promise.all([
          companiesApi.get(user.companyId),
          workplacesApi.getMine(),
          companiesApi.getMembers(user.companyId),
        ]);
        setCompany(companyData);
        setWorkplaces(workplaceData);
        setMembers(memberData);
      } else {
        setCompany(null);
        setWorkplaces([]);
        setMembers([]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateCompany(e: FormEvent) {
    e.preventDefault();
    setCompanyError(null);

    if (companyName.trim().length < 5) {
      setCompanyError("Company name must be at least 5 characters.");
      return;
    }

    setCompanySubmitting(true);
    try {
      const created = await companiesApi.create({ name: companyName.trim() });
      setCompany(created);
      setWorkplaces([]);
      setShowCreateCompany(false);
      setCompanyName("");
      await refreshUser();
    } catch (err) {
      setCompanyError(getErrorMessage(err));
    } finally {
      setCompanySubmitting(false);
    }
  }

  async function handleCreateWorkplace(e: FormEvent) {
    e.preventDefault();
    setWorkplaceError(null);

    if (!workplaceName.trim()) {
      setWorkplaceError("Workplace name is required.");
      return;
    }

    setWorkplaceSubmitting(true);
    try {
      const created = await workplacesApi.create({
        name: workplaceName.trim(),
        location: workplaceLocation,
      });
      setWorkplaces((prev) => [...prev, created]);
      setShowCreateWorkplace(false);
      setWorkplaceName("");
      setWorkplaceLocation(null);
    } catch (err) {
      setWorkplaceError(getErrorMessage(err));
    } finally {
      setWorkplaceSubmitting(false);
    }
  }

  // ── Invite member ────────────────────────────────────────────
  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    const email = inviteEmail.trim();
    if (!email) {
      setInviteError("Email is required.");
      return;
    }

    setInviteSubmitting(true);
    try {
      await invitationsApi.invite({ email });
      setInviteSuccess(`An invitation has been created for ${email}.`);
      setInviteEmail("");
    } catch (err) {
      setInviteError(getErrorMessage(err));
    } finally {
      setInviteSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading your workspace…" />;
  }

  if (error) {
    return (
      <div className="card">
        <Alert>{error}</Alert>
      </div>
    );
  }

  // ── User WITHOUT a company ─────────────────────────────────
  if (!company) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-header-title">Dashboard</h1>
            <p className="page-header-subtitle">
              Welcome, {user?.name}. Let's get you set up.
            </p>
          </div>
        </div>

        <div className="card">
          <EmptyState
            icon={<IconBuilding />}
            title="You're not part of a company yet."
            description="Create a company to start managing workplaces, projects, and time tracking. Joining an existing company is coming soon."
            actions={
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateCompany(true)}
                >
                  <IconPlus />
                  Create company
                </button>
                <button
                  className="btn btn-secondary"
                  disabled
                  title="Coming soon"
                >
                  Join company
                </button>
              </>
            }
          />
        </div>

        {showCreateCompany && (
          <Modal
            title="Create company"
            description="You'll become the first manager of this company."
            onClose={() => setShowCreateCompany(false)}
            footer={
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCreateCompany(false)}
                  disabled={companySubmitting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateCompany}
                  disabled={companySubmitting}
                >
                  {companySubmitting ? "Creating…" : "Create company"}
                </button>
              </>
            }
          >
            {companyError && (
              <div style={{ marginBottom: 16 }}>
                <Alert>{companyError}</Alert>
              </div>
            )}
            <form onSubmit={handleCreateCompany}>
              <div className="form-group">
                <label className="form-label" htmlFor="company-name">
                  Company name
                </label>
                <input
                  id="company-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Corporation"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={companySubmitting}
                />
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  // ── User WITH a company ────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Dashboard</h1>
          <p className="page-header-subtitle">
            {company.name} · {workplaces.length}{" "}
            {workplaces.length === 1 ? "workplace" : "workplaces"}
          </p>
        </div>
      </div>

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
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            {company.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{company.name}</div>
            <div className="muted small">Your company</div>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2>Company members</h2>
        {user?.companyRole === "MANAGER" && (
          <div className="section-header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowInviteModal(true)}
            >
              <IconPlus />
              Invite member
            </button>
          </div>
        )}
      </div>

      {members.length === 0 ? (
        <div className="card" style={{ marginBottom: 24 }}>
          <EmptyState
            icon={<IconUsers />}
            title="No members yet."
            description="Invite people to your company and they will show up here."
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
                <th>Member</th>
                <th>Username</th>
                <th>Role</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        className="topbar-avatar"
                        aria-hidden="true"
                        style={{ flexShrink: 0 }}
                      >
                        {getInitials(`${member.name} ${member.lastname}`)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {member.name} {member.lastname}
                        </div>
                        <div className="muted small">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="muted">{member.username}</td>
                  <td>{roleBadge(member.companyRole)}</td>
                  <td style={{ textAlign: "right" }}>
                    {/* Reserved for future member-management actions */}
                    <span className="muted small">—</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-header">
        <h2>Workplaces</h2>
        {user?.companyRole === "MANAGER" && (
          <div className="section-header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateWorkplace(true)}
            >
              <IconPlus />
              Create workplace
            </button>
          </div>
        )}
      </div>

      {workplaces.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconBuilding />}
            title="No workplaces yet."
            description="Create your first workplace to start organizing projects. If you don't see a create button, ask your company manager to add you to a workplace."
            actions={
              user?.companyRole === "MANAGER" ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateWorkplace(true)}
                >
                  <IconPlus />
                  Create workplace
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid-2">
          {workplaces.map((wp) => (
            <div
              key={wp.id}
              className="card card-hover card-clickable"
              onClick={() => onOpenWorkplace(wp.id)}
              style={{ display: "flex", alignItems: "center", gap: 16 }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "var(--color-primary-soft)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconBuilding />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{wp.name}</div>
                <div
                  className="muted small"
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <IconMapPin />
                  {wp.location?.city || "No location set"}
                </div>
              </div>
              <IconChevronRight />
            </div>
          ))}
        </div>
      )}

      {showCreateWorkplace && (
        <Modal
          title="Create workplace"
          description="A workplace is a physical or virtual location where projects happen."
          onClose={() => setShowCreateWorkplace(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateWorkplace(false)}
                disabled={workplaceSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateWorkplace}
                disabled={workplaceSubmitting}
              >
                {workplaceSubmitting ? "Creating…" : "Create workplace"}
              </button>
            </>
          }
        >
          {workplaceError && (
            <div style={{ marginBottom: 16 }}>
              <Alert>{workplaceError}</Alert>
            </div>
          )}
          <form onSubmit={handleCreateWorkplace}>
            <div className="form-group">
              <label className="form-label" htmlFor="workplace-name">
                Name
              </label>
              <input
                id="workplace-name"
                type="text"
                className="form-input"
                placeholder="e.g. Vilnius Office"
                value={workplaceName}
                onChange={(e) => setWorkplaceName(e.target.value)}
                disabled={workplaceSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <MapPicker
                value={workplaceLocation}
                onChange={setWorkplaceLocation}
              />
            </div>
          </form>
        </Modal>
      )}

      {showInviteModal && (
        <Modal
          title="Invite member"
          description="Send an invitation to join your company. The recipient will receive an email with a link to accept."
          onClose={() => {
            setShowInviteModal(false);
            setInviteEmail("");
            setInviteError(null);
            setInviteSuccess(null);
          }}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail("");
                  setInviteError(null);
                  setInviteSuccess(null);
                }}
                disabled={inviteSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleInvite}
                disabled={inviteSubmitting}
              >
                {inviteSubmitting ? "Sending…" : "Send invitation"}
              </button>
            </>
          }
        >
          {inviteError && (
            <div style={{ marginBottom: 16 }}>
              <Alert type="error">{inviteError}</Alert>
            </div>
          )}
          {inviteSuccess && (
            <div style={{ marginBottom: 16 }}>
              <Alert type="success">{inviteSuccess}</Alert>
            </div>
          )}
          <form onSubmit={handleInvite}>
            <div className="form-group">
              <label className="form-label" htmlFor="invite-email">
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                className="form-input"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteSuccess(null);
                  setInviteError(null);
                }}
                autoComplete="email"
                disabled={inviteSubmitting}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
