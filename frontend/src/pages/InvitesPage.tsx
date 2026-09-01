import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { getErrorMessage, invitationsApi } from "../api";
import type { InvitationResponse, InvitationStatus } from "../types";
import { Alert, EmptyState, IconUsers, LoadingState } from "../components";
import { formatDateTime } from "../utils";

// ── Status badge (mirrors the project StatusBadge styling) ───

const STATUS_BADGE: Record<
  InvitationStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: "badge-warning" },
  ACCEPTED: { label: "Accepted", className: "badge-success" },
  DECLINED: { label: "Declined", className: "badge-danger" },
  EXPIRED: { label: "Expired", className: "badge-muted" },
  CANCELLED: { label: "Cancelled", className: "badge-danger" },
};

function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  const meta = STATUS_BADGE[status] ?? {
    label: status,
    className: "badge-muted",
  };
  return <span className={`badge ${meta.className}`}>{meta.label}</span>;
}

/** The link an invited person opens. Email delivery is not built yet,
 * so managers copy/share this link manually. */
function invitationLink(token: string): string {
  return `${window.location.origin}/invitations/${token}`;
}

/**
 * Invites tab:
 * - Everyone sees invitations addressed to them and can accept a pending one
 *   (only possible while they are not part of a company).
 * - Managers additionally see an invite-by-email form and the invitations
 *   they have sent, each with a copyable invitation link (no email yet).
 */
export default function InvitesPage() {
  const { user, refreshUser } = useAuth();

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

  const isManager = user?.companyRole === "MANAGER" && user.companyId !== null;

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
      setFormError("Email is required.");
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
      // The user's company changed — refresh the session user, then reload.
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
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Fallback for browsers without the async clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = token;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  if (loading) {
    return <LoadingState label="Loading invitations…" />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Invites</h1>
          <p className="page-header-subtitle">
            Invitations to your company and sent to you
          </p>
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
          <h3 style={{ margin: "0 0 8px" }}>Invite to your company</h3>
          <p className="muted small" style={{ margin: "0 0 16px" }}>
            Email delivery is not set up yet — copy the invitation link and
            share it with the person you're inviting.
          </p>

          {created && (
            <div style={{ marginBottom: 16 }}>
              <Alert type="success">
                Invitation created for <strong>{created.email}</strong>. It is
                valid until {formatDateTime(created.expiresAt)}.
              </Alert>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginTop: 8,
                  flexWrap: "wrap",
                }}
              >
                <code
                  style={{
                    flex: 1,
                    minWidth: 240,
                    padding: "8px 12px",
                    background: "var(--color-bg-muted, #f5f5f5)",
                    borderRadius: 8,
                    fontSize: 13,
                    wordBreak: "break-all",
                  }}
                >
                  {invitationLink(created.token)}
                </code>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => copyLink(created.token)}
                >
                  {copiedToken === created.token ? "Copied!" : "Copy link"}
                </button>
              </div>
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
              {sending ? "Sending…" : "Send invitation"}
            </button>
          </form>
        </div>
      )}

      {/* ── Sent invitations (managers) ───────────────────── */}
      {isManager && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px" }}>Sent invitations</h3>
          {sentInvites.length === 0 ? (
            <EmptyState
              icon={<IconUsers />}
              title="No invitations sent yet"
              description="Invite someone by email above — they'll receive a link to join your company."
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
                      Valid until {formatDateTime(invitation.expiresAt)}
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
                        ? "Copied!"
                        : "Copy link"}
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
        <h3 style={{ margin: "0 0 16px" }}>My invitations</h3>

        {acceptError && (
          <div style={{ marginBottom: 16 }}>
            <Alert>{acceptError}</Alert>
          </div>
        )}

        {myInvites.length === 0 ? (
          <EmptyState
            icon={<IconUsers />}
            title="No invitations"
            description="When a company manager invites you, it will show up here."
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
                      {invitation.email} · valid until{" "}
                      {formatDateTime(invitation.expiresAt)}
                    </div>
                  </div>
                  <InvitationStatusBadge status={invitation.status} />
                  {invitation.status === "PENDING" &&
                    (user?.companyId ? (
                      <span className="muted small">
                        You're already in a company
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={acceptingToken !== null}
                        onClick={() => handleAccept(invitation)}
                      >
                        {acceptingToken === invitation.token
                          ? "Accepting…"
                          : "Accept"}
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
