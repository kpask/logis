import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { getErrorMessage, invitationsApi } from "../api";
import type { InvitationResponse, InvitationStatus } from "../types";
import { Alert, EmptyState, IconUsers, LoadingState } from "../components";
import { formatDateTime, isManagerOrHigher } from "../utils";
import { useI18n } from "../i18n";

// ── Status badge (mirrors the project StatusBadge styling) ───

const STATUS_BADGE: Record<
  InvitationStatus,
  { labelKey: string; className: string }
> = {
  PENDING: { labelKey: "invitationStatusPending", className: "badge-warning" },
  ACCEPTED: {
    labelKey: "invitationStatusAccepted",
    className: "badge-success",
  },
  DECLINED: { labelKey: "invitationStatusDeclined", className: "badge-danger" },
  EXPIRED: { labelKey: "invitationStatusExpired", className: "badge-muted" },
  CANCELLED: {
    labelKey: "invitationStatusCancelled",
    className: "badge-danger",
  },
};

function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  const { t } = useI18n();
  const meta = STATUS_BADGE[status] ?? {
    labelKey: "invitationStatusPending",
    className: "badge-muted",
  };
  return (
    <span className={`badge ${meta.className}`}>{t(meta.labelKey as any)}</span>
  );
}

/** The link an invited person opens. Email delivery is not built yet,
 * so managers copy/share this link manually. */
function invitationLink(token: string): string {
  return `${window.location.origin}/invitations/${token}`;
}

export default function InvitesPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();

  const [myInvites, setMyInvites] = useState<InvitationResponse[]>([]);
  const [sentInvites, setSentInvites] = useState<InvitationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite form state (managers only)
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<InvitationResponse | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Accept state
  const [acceptingToken, setAcceptingToken] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const isManager =
    isManagerOrHigher(user?.companyRole) && user?.companyId != null;

  const load = useCallback(async () => {
    setError(null);
    try {
      const mine = await invitationsApi.getMine();
      setMyInvites(mine);
      if (isManager) {
        setSentInvites(await invitationsApi.getSent());
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.companyId, user?.companyRole]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setCreated(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setFormError(t("invitesEmailRequired"));
      return;
    }

    setSending(true);
    try {
      const invitation = await invitationsApi.invite({ email: trimmed });
      setCreated(invitation);
      setEmail("");
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  async function handleAccept(invitation: InvitationResponse) {
    setAcceptError(null);
    setAcceptingToken(invitation.token);
    try {
      await invitationsApi.accept(invitation.token);
      await refreshUser();
      await load();
    } catch (err) {
      setAcceptError(getErrorMessage(err));
      await load();
    } finally {
      setAcceptingToken(null);
    }
  }

  async function copyLink(token: string) {
    const link = invitationLink(token);
    // navigator.clipboard only exists in secure contexts (HTTPS / localhost),
    // so self-hosted deployments over plain HTTP must use the fallback below.
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(link);
      } catch {
        copyViaExecCommand(link);
      }
    } else {
      copyViaExecCommand(link);
    }
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  /** Fallback for non-secure contexts where the async Clipboard API is unavailable. */
  function copyViaExecCommand(text: string) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  if (loading) {
    return <LoadingState label={t("loadingInvitations")} />;
  }

  return (
    <div className="page-container page-container--compact">
      <div className="page-header">
        <div>
          <h1 className="page-header-title">{t("invitesTitle")}</h1>
          <p className="page-header-subtitle">{t("invitesSubtitle")}</p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16 }}>
          <Alert>{error}</Alert>
        </div>
      )}

      {/* ── Invite someone (managers) ─────────────────────── */}
      {isManager && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 8px" }}>{t("invitesInviteTitle")}</h3>
          <p className="muted small" style={{ margin: "0 0 16px" }}>
            {t("invitesInviteDesc")}
          </p>

          {created && (
            <div style={{ marginBottom: 16 }}>
              <Alert type="success">
                {t("invitesCreatedFor", {
                  email: created.email,
                  expiry: formatDateTime(created.expiresAt),
                })}
              </Alert>
            </div>
          )}

          {formError && (
            <div style={{ marginBottom: 16 }}>
              <Alert>{formError}</Alert>
            </div>
          )}

          <form
            onSubmit={handleInvite}
            style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            <input
              type="email"
              className="form-input"
              style={{ flex: 1, minWidth: 220 }}
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending}
            >
              {sending ? t("invitesSending") : t("invitesSendInvitation")}
            </button>
          </form>
        </div>
      )}

      {/* ── Sent invitations (managers) ───────────────────── */}
      {isManager && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px" }}>{t("invitesSentTitle")}</h3>
          {sentInvites.length === 0 ? (
            <EmptyState
              icon={<IconUsers />}
              title={t("invitesSentEmptyTitle")}
              description={t("invitesSentEmptyDesc")}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sentInvites.map((invitation) => (
                <div
                  key={invitation.token}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    padding: "12px 0",
                    borderBottom: "1px solid var(--color-border, #eee)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 500 }}>{invitation.email}</div>
                    <div className="muted small">
                      {t("invitesValidUntil", {
                        date: formatDateTime(invitation.expiresAt),
                      })}
                    </div>
                  </div>
                  <InvitationStatusBadge status={invitation.status} />
                  {invitation.status === "PENDING" && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => copyLink(invitation.token)}
                    >
                      {copiedToken === invitation.token
                        ? t("invitesCopied")
                        : t("invitesCopyLink")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── My invitations ────────────────────────────────── */}
      <div className="card">
        <h3 style={{ margin: "0 0 16px" }}>{t("invitesMyInvitesTitle")}</h3>

        {acceptError && (
          <div style={{ marginBottom: 16 }}>
            <Alert>{acceptError}</Alert>
          </div>
        )}

        {myInvites.length === 0 ? (
          <EmptyState
            icon={<IconUsers />}
            title={t("invitesEmptyTitle")}
            description={t("invitesEmptyDesc")}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {myInvites.map((invitation) => {
              return (
                <div
                  key={invitation.token}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    padding: "12px 0",
                    borderBottom: "1px solid var(--color-border, #eee)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 600 }}>
                      {invitation.companyName}
                    </div>
                    <div className="muted small">
                      {invitation.email} ·{" "}
                      {t("invitesValidUntil", {
                        date: formatDateTime(invitation.expiresAt),
                      })}
                    </div>
                  </div>
                  <InvitationStatusBadge status={invitation.status} />
                  {invitation.status === "PENDING" &&
                    (user?.companyId ? (
                      <span className="muted small">
                        {t("invitesAlreadyInCompany")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={acceptingToken !== null}
                        onClick={() => handleAccept(invitation)}
                      >
                        {acceptingToken === invitation.token
                          ? t("invitesAccepting")
                          : t("invitesAccept")}
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
