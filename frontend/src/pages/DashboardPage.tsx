import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import {
  companiesApi,
  getErrorMessage,
  invitationsApi,
  workplacesApi,
} from "../api";
import UserWorkCalendarModal from "../UserWorkCalendarModal";
import type {
  CompanyResponse,
  CompanyRole,
  CompanySettingsResponse,
  Location,
  UserResponse,
  WorkplaceResponse,
} from "../types";
import {
  Alert,
  DropdownMenu,
  EmptyState,
  IconBuilding,
  IconMapPin,
  IconPlus,
  IconUsers,
  LoadingState,
  Modal,
} from "../components";
import type { DropdownMenuItem } from "../components";
import { getInitials, isManagerOrHigher } from "../utils";
import { useI18n } from "../i18n";
import MapPicker from "../MapPicker";

function roleBadge(role: CompanyRole | null | undefined) {
  const { t } = useI18n();
  if (role === "OWNER") {
    return <span className="badge badge-primary">{t("roleOwner")}</span>;
  }
  if (role === "MANAGER") {
    return <span className="badge badge-primary">{t("roleManager")}</span>;
  }
  return <span className="badge badge-muted">{t("roleWorker")}</span>;
}

interface DashboardPageProps {
  onOpenWorkplace: (workplaceId: number) => void;
}

export default function DashboardPage({ onOpenWorkplace }: DashboardPageProps) {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();

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

  // Edit company modal
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLunchLength, setEditLunchLength] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Company settings (default work times + lunch length)
  const [companySettings, setCompanySettings] =
    useState<CompanySettingsResponse | null>(null);

  // Create workplace modal
  const [showCreateWorkplace, setShowCreateWorkplace] = useState(false);
  const [workplaceName, setWorkplaceName] = useState("");
  const [workplaceLocation, setWorkplaceLocation] = useState<Location | null>(
    null
  );
  const [workplaceRadius, setWorkplaceRadius] = useState(150);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [workplaceSubmitting, setWorkplaceSubmitting] = useState(false);
  const [workplaceError, setWorkplaceError] = useState<string | null>(null);

  // Delete workplace
  const [workplaceDeletingId, setWorkplaceDeletingId] = useState<number | null>(
    null
  );
  const [workplaceDeleteError, setWorkplaceDeleteError] = useState<
    string | null
  >(null);

  // Invite member modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Member management (managers only)
  const [memberActionError, setMemberActionError] = useState<string | null>(
    null
  );
  const [memberActionId, setMemberActionId] = useState<number | null>(null);
  const [calendarMember, setCalendarMember] = useState<UserResponse | null>(
    null
  );
  const [openMenuMember, setOpenMenuMember] = useState<UserResponse | null>(
    null
  );
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

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

        // Company settings (default work times + lunch length)
        if (isManagerOrHigher(user.companyRole)) {
          try {
            setCompanySettings(await companiesApi.getSettings());
          } catch {
            setCompanySettings(null);
          }
        }
      } else {
        setCompany(null);
        setWorkplaces([]);
        setMembers([]);
        setCompanySettings(null);
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
      setCompanyError(t("createCompanyErrorShort"));
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

  function handleOpenEditCompany() {
    setEditError(null);
    setEditName(company?.name ?? "");
    setEditLunchLength(companySettings?.defaultLunchLength?.toString() ?? "");
    setEditStartTime(companySettings?.defaultStartTime ?? "");
    setEditEndTime(companySettings?.defaultEndTime ?? "");
    setShowEditCompany(true);
  }

  async function handleSaveEditCompany(e: FormEvent) {
    e.preventDefault();
    setEditError(null);

    const trimmedName = editName.trim();
    if (trimmedName.length < 5) {
      setEditError(t("createCompanyErrorShort"));
      return;
    }

    setEditSubmitting(true);
    try {
      const updated = await companiesApi.edit({ name: trimmedName });
      setCompany(updated);

      const settingsPayload: Record<string, string | number> = {};
      if (editLunchLength) {
        settingsPayload.defaultLunchLength = Number(editLunchLength);
      }
      if (editStartTime) {
        settingsPayload.defaultStartTime = editStartTime;
      }
      if (editEndTime) {
        settingsPayload.defaultEndTime = editEndTime;
      }
      if (Object.keys(settingsPayload).length > 0) {
        await companiesApi.updateSettings(settingsPayload);
        setCompanySettings((prev) => ({
          defaultLunchLength:
            (settingsPayload.defaultLunchLength as number) ??
            prev?.defaultLunchLength ??
            30,
          defaultStartTime:
            (settingsPayload.defaultStartTime as string) ??
            prev?.defaultStartTime ??
            "08:00",
          defaultEndTime:
            (settingsPayload.defaultEndTime as string) ??
            prev?.defaultEndTime ??
            "17:00",
        }));
      }

      setShowEditCompany(false);
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setEditSubmitting(false);
    }
  }

  function closeCreateWorkplace() {
    setShowCreateWorkplace(false);
    setWorkplaceName("");
    setWorkplaceLocation(null);
    setWorkplaceRadius(150);
    setShowLocationPicker(false);
    setWorkplaceError(null);
  }

  async function handleCreateWorkplace(e: FormEvent) {
    e.preventDefault();
    setWorkplaceError(null);

    if (!workplaceName.trim()) {
      setWorkplaceError(t("createWorkplaceNameRequired"));
      return;
    }

    setWorkplaceSubmitting(true);
    try {
      const created = await workplacesApi.create({
        name: workplaceName.trim(),
        location: showLocationPicker ? workplaceLocation : null,
        radiusDistance: showLocationPicker ? workplaceRadius : null,
      });
      setWorkplaces((prev) => [...prev, created]);
      closeCreateWorkplace();
    } catch (err) {
      setWorkplaceError(getErrorMessage(err));
    } finally {
      setWorkplaceSubmitting(false);
    }
  }

  // ── Workplace management (delete) ──────────────────────────
  async function handleDeleteWorkplace(wp: WorkplaceResponse) {
    const confirmed = window.confirm(
      t("workplacesDeleteConfirm").replace("{name}", wp.name)
    );
    if (!confirmed) return;

    setWorkplaceDeleteError(null);
    setWorkplaceDeletingId(wp.id);
    try {
      await workplacesApi.delete(wp.id);
      setWorkplaces((prev) => prev.filter((w) => w.id !== wp.id));
    } catch (err) {
      setWorkplaceDeleteError(getErrorMessage(err));
    } finally {
      setWorkplaceDeletingId(null);
    }
  }

  function workplaceActions(wp: WorkplaceResponse): DropdownMenuItem[] {
    return [
      {
        label: t("delete"),
        danger: true,
        disabled: workplaceDeletingId === wp.id,
        onSelect: () => handleDeleteWorkplace(wp),
      },
    ];
  }

  // ── Member management (transfer / promote / kick) ────────────
  async function handleTransferOwnership(member: UserResponse) {
    const confirmed = window.confirm(
      t("confirmTransferOwnership")
        .replace("{company}", company?.name ?? t("companyFallback"))
        .replace("{name}", member.name)
        .replace("{lastname}", member.lastname)
    );
    if (!confirmed) return;

    setMemberActionError(null);
    setMemberActionId(member.id);
    try {
      await companiesApi.transferOwnership(member.id);
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id === member.id) return { ...m, companyRole: "OWNER" };
          if (user && m.id === user.id) return { ...m, companyRole: "MANAGER" };
          return m;
        })
      );
      await refreshUser();
    } catch (err) {
      setMemberActionError(getErrorMessage(err));
    } finally {
      setMemberActionId(null);
    }
  }

  async function handlePromote(member: UserResponse) {
    const confirmed = window.confirm(
      t("confirmPromote")
        .replace("{name}", member.name)
        .replace("{lastname}", member.lastname)
    );
    if (!confirmed) return;

    setMemberActionError(null);
    setMemberActionId(member.id);
    try {
      await companiesApi.promote(member.id);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, companyRole: "MANAGER" } : m
        )
      );
      await refreshUser();
    } catch (err) {
      setMemberActionError(getErrorMessage(err));
    } finally {
      setMemberActionId(null);
    }
  }

  async function handleDemote(member: UserResponse) {
    const confirmed = window.confirm(
      t("confirmDemote")
        .replace("{name}", member.name)
        .replace("{lastname}", member.lastname)
    );
    if (!confirmed) return;

    setMemberActionError(null);
    setMemberActionId(member.id);
    try {
      await companiesApi.demote(member.id);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, companyRole: "USER" } : m
        )
      );
      await refreshUser();
    } catch (err) {
      setMemberActionError(getErrorMessage(err));
    } finally {
      setMemberActionId(null);
    }
  }

  async function handleKick(member: UserResponse) {
    const confirmed = window.confirm(
      t("confirmKick")
        .replace("{name}", member.name)
        .replace("{lastname}", member.lastname)
        .replace("{company}", company?.name ?? t("companyFallback"))
    );
    if (!confirmed) return;

    setMemberActionError(null);
    setMemberActionId(member.id);
    try {
      await companiesApi.kick(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (err) {
      setMemberActionError(getErrorMessage(err));
    } finally {
      setMemberActionId(null);
    }
  }

  // ── Invite member ────────────────────────────────────────────
  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    const email = inviteEmail.trim();
    if (!email) {
      setInviteError(t("inviteMemberErrorRequired"));
      return;
    }

    setInviteSubmitting(true);
    try {
      await invitationsApi.invite({ email });
      setInviteSuccess(t("inviteMemberSuccess").replace("{email}", email));
      setInviteEmail("");
    } catch (err) {
      setInviteError(getErrorMessage(err));
    } finally {
      setInviteSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState label={t("dashboardLoading")} />;
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
      <div className="page-container page-container--compact">
        <div className="page-header">
          <div>
            <h1 className="page-header-title">{t("dashboardTitle")}</h1>
            <p className="page-header-subtitle">
              {t("dashboardWelcome").replace("{name}", user?.name ?? "")}
            </p>
          </div>
        </div>

        <div className="card">
          <EmptyState
            icon={<IconBuilding />}
            title={t("dashboardNoCompanyTitle")}
            description={t("dashboardNoCompanyDesc")}
            actions={
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateCompany(true)}
                >
                  <IconPlus />
                  {t("dashboardCreateCompany")}
                </button>
                <button
                  className="btn btn-secondary"
                  disabled
                  title={t("comingSoon")}
                >
                  {t("dashboardJoinCompany")}
                </button>
              </>
            }
          />
        </div>

        {showCreateCompany && (
          <Modal
            title={t("createCompanyTitle")}
            description={t("createCompanyDesc")}
            onClose={() => setShowCreateCompany(false)}
            footer={
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCreateCompany(false)}
                  disabled={companySubmitting}
                >
                  {t("cancel")}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateCompany}
                  disabled={companySubmitting}
                >
                  {companySubmitting
                    ? t("createCompanySubmitting")
                    : t("createCompanySubmit")}
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
                  {t("createCompanyNameLabel")}
                </label>
                <input
                  id="company-name"
                  type="text"
                  className="form-input"
                  placeholder={t("editCompanyNamePlaceholder")}
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
    <div className="page-container page-container--compact">
      <div className="page-header">
        <div>
          <h1 className="page-header-title">{t("dashboardTitle")}</h1>
          <p className="page-header-subtitle">
            {company.name} · {workplaces.length}{" "}
            {workplaces.length === 1
              ? t("workplaceSingular")
              : t("workplacePlural")}
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{company.name}</div>
            <div className="muted small">{t("dashboardYourCompany")}</div>
          </div>
          {isManagerOrHigher(user?.companyRole) && (
            <div style={{ flexShrink: 0 }}>
              <DropdownMenu
                items={[
                  {
                    label: t("editCompanyTitle"),
                    onSelect: handleOpenEditCompany,
                  },
                ]}
                title={t("companyActions")}
              />
            </div>
          )}
        </div>
      </div>

      <div className="section-header">
        <h2>{t("dashboardMembers")}</h2>
        {isManagerOrHigher(user?.companyRole) && (
          <div className="section-header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowInviteModal(true)}
            >
              <IconPlus />
              {t("dashboardInviteMember")}
            </button>
          </div>
        )}
      </div>

      {memberActionError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <Alert>{memberActionError}</Alert>
        </div>
      )}

      {members.length === 0 ? (
        <div className="card" style={{ marginBottom: 24 }}>
          <EmptyState
            icon={<IconUsers />}
            title={t("dashboardNoMembers")}
            description={t("dashboardNoMembersDesc")}
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
                <th>{t("colMember")}</th>
                <th>{t("colUsername")}</th>
                <th>{t("colRole")}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    setMenuPosition({
                      top: Math.min(e.clientY + 4, window.innerHeight - 120),
                      left: Math.max(
                        8,
                        Math.min(e.clientX, window.innerWidth - 200)
                      ),
                    });
                    setOpenMenuMember(member);
                  }}
                >
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openMenuMember && (
        <div
          className="dropdown-menu-popup"
          style={{
            position: "fixed",
            top: menuPosition.top,
            left: menuPosition.left,
            zIndex: 1000,
          }}
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="dropdown-item"
            onClick={() => {
              setCalendarMember(openMenuMember);
              setOpenMenuMember(null);
            }}
          >
            {t("dashboardViewCalendar")}
          </button>
          {user?.companyRole === "OWNER" && openMenuMember.id !== user?.id && (
            <>
              {openMenuMember.companyRole !== "OWNER" && (
                <button
                  type="button"
                  role="menuitem"
                  className="dropdown-item"
                  disabled={memberActionId === openMenuMember.id}
                  onClick={() => {
                    handleTransferOwnership(openMenuMember);
                    setOpenMenuMember(null);
                  }}
                >
                  {t("dashboardTransferOwnership")}
                </button>
              )}
              {openMenuMember.companyRole === "USER" && (
                <button
                  type="button"
                  role="menuitem"
                  className="dropdown-item"
                  disabled={memberActionId === openMenuMember.id}
                  onClick={() => {
                    handlePromote(openMenuMember);
                    setOpenMenuMember(null);
                  }}
                >
                  {t("dashboardPromoteToManager")}
                </button>
              )}
              {openMenuMember.companyRole === "MANAGER" && (
                <button
                  type="button"
                  role="menuitem"
                  className="dropdown-item"
                  disabled={memberActionId === openMenuMember.id}
                  onClick={() => {
                    handleDemote(openMenuMember);
                    setOpenMenuMember(null);
                  }}
                >
                  {t("dashboardDemoteToWorker")}
                </button>
              )}
              {openMenuMember.companyRole !== "OWNER" && (
                <button
                  type="button"
                  role="menuitem"
                  className="dropdown-item danger"
                  disabled={memberActionId === openMenuMember.id}
                  onClick={() => {
                    handleKick(openMenuMember);
                    setOpenMenuMember(null);
                  }}
                >
                  {t("dashboardKickFromCompany")}
                </button>
              )}
            </>
          )}
        </div>
      )}
      {openMenuMember && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
          }}
          onClick={() => setOpenMenuMember(null)}
        />
      )}

      <div className="section-header">
        <h2>{t("workplacesTitle")}</h2>
        {isManagerOrHigher(user?.companyRole) && (
          <div className="section-header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateWorkplace(true)}
            >
              <IconPlus />
              {t("workplacesCreateWorkplace")}
            </button>
          </div>
        )}
      </div>

      {workplaceDeleteError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <Alert>{workplaceDeleteError}</Alert>
        </div>
      )}

      {workplaces.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconBuilding />}
            title={t("workplacesNoWorkplacesTitle")}
            description={t("dashboardNoWorkplacesDesc")}
            actions={
              isManagerOrHigher(user?.companyRole) ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateWorkplace(true)}
                >
                  <IconPlus />
                  {t("workplacesCreateWorkplace")}
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
                  {wp.location?.city || t("noLocationSet")}
                </div>
              </div>
              {isManagerOrHigher(user?.companyRole) && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ flexShrink: 0 }}
                >
                  <DropdownMenu
                    items={workplaceActions(wp)}
                    disabled={workplaceDeletingId === wp.id}
                    title={t("workplaceActionsMenuTitle")}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateWorkplace && (
        <Modal
          title={t("createWorkplaceTitle")}
          description={t("createWorkplaceDesc")}
          onClose={closeCreateWorkplace}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={closeCreateWorkplace}
                disabled={workplaceSubmitting}
              >
                {t("cancel")}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateWorkplace}
                disabled={workplaceSubmitting}
              >
                {workplaceSubmitting
                  ? t("createWorkplaceSubmitting")
                  : t("createWorkplaceSubmit")}
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
                {t("createWorkplaceNameLabel")}
              </label>
              <input
                id="workplace-name"
                type="text"
                className="form-input"
                placeholder={t("createWorkplaceNamePlaceholder")}
                value={workplaceName}
                onChange={(e) => setWorkplaceName(e.target.value)}
                disabled={workplaceSubmitting}
              />
            </div>
            <div className="form-group">
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={showLocationPicker}
                  onChange={(e) => {
                    setShowLocationPicker(e.target.checked);
                    if (!e.target.checked) {
                      setWorkplaceLocation(null);
                    }
                  }}
                  disabled={workplaceSubmitting}
                />
                {t("createWorkplaceSetLocation")}
              </label>
              {showLocationPicker && (
                <div style={{ marginTop: 12 }}>
                  <MapPicker
                    value={workplaceLocation}
                    onChange={setWorkplaceLocation}
                    radiusMeters={workplaceRadius}
                  />
                  <div style={{ marginTop: 12 }}>
                    <label className="form-label" htmlFor="workplace-radius">
                      {t("createWorkplaceRadiusLabel", {
                        radius: workplaceRadius,
                      })}
                    </label>
                    <input
                      id="workplace-radius"
                      type="range"
                      min={50}
                      max={2000}
                      step={10}
                      className="form-input"
                      value={workplaceRadius}
                      onChange={(e) =>
                        setWorkplaceRadius(Number(e.target.value))
                      }
                      disabled={workplaceSubmitting}
                    />
                    <div className="muted small">
                      {t("createWorkplaceRadiusHelp")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}

      {calendarMember && (
        <UserWorkCalendarModal
          member={calendarMember}
          onClose={() => setCalendarMember(null)}
        />
      )}

      {showInviteModal && (
        <Modal
          title={t("inviteMemberTitle")}
          description={t("inviteMemberDesc")}
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
                {t("cancel")}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleInvite}
                disabled={inviteSubmitting}
              >
                {inviteSubmitting
                  ? t("inviteMemberSubmitting")
                  : t("inviteMemberSubmit")}
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
                {t("inviteMemberEmailLabel")}
              </label>
              <input
                id="invite-email"
                type="email"
                className="form-input"
                placeholder={t("inviteMemberEmailPlaceholder")}
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

      {showEditCompany && (
        <Modal
          title={t("editCompanyTitle")}
          description={t("editCompanyDesc")}
          onClose={() => setShowEditCompany(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditCompany(false)}
                disabled={editSubmitting}
              >
                {t("cancel")}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveEditCompany}
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
          <form onSubmit={handleSaveEditCompany}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-company-name">
                {t("editCompanyNameLabel")}
              </label>
              <input
                id="edit-company-name"
                type="text"
                className="form-input"
                placeholder={t("editCompanyNamePlaceholder")}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={editSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-lunch-length">
                {t("editCompanyLunchLabel")}
              </label>
              <input
                id="edit-lunch-length"
                type="number"
                min="0"
                className="form-input"
                placeholder="30"
                value={editLunchLength}
                onChange={(e) => setEditLunchLength(e.target.value)}
                disabled={editSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-start-time">
                {t("editCompanyStartTimeLabel")}
              </label>
              <input
                id="edit-start-time"
                type="time"
                className="form-input"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                disabled={editSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-end-time">
                {t("editCompanyEndTimeLabel")}
              </label>
              <input
                id="edit-end-time"
                type="time"
                className="form-input"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                disabled={editSubmitting}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
