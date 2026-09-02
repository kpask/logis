import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { getErrorMessage, invitationsApi, isApiError } from "../api";
import type { InvitationResponse } from "../types";
import { Alert, LoadingState } from "../components";
import { parseDate } from "../utils";

interface InvitationPageProps {
  token: string;
  /** Navigate to the normal sign-in page (existing users accept the invite from the Invites tab). */
  onGoToLogin: () => void;
}

/**
 * Landing page for company invitations (/invitations/:token).
 *
 * - Fetches invitation info from GET /invites/{token}
 * - When the invited user does NOT exist yet: shows a registration form
 *   (email is pre-filled from the invitation and not editable).
 * - When the user DOES exist: points them to the normal sign-in page —
 *   they accept the invitation afterwards from the Invites tab.
 * - Handles expired / already-used / not-found / network-error states cleanly.
 */
type LoadErrorType = "not-found" | "network" | "other";

export default function InvitationPage({
  token,
  onGoToLogin,
}: InvitationPageProps) {
  const { registerWithInvitation } = useAuth();

  const [invitation, setInvitation] = useState<InvitationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadErrorType | null>(null);
  const [loadErrorDetail, setLoadErrorDetail] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Registration form state
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadInvitation = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setLoadErrorDetail("");
    setStatusMessage(null);
    try {
      const data = await invitationsApi.get(token);
      setInvitation(data);

      // Proactive expiry check (defence-in-depth): the backend may return
      // status=PENDING for an invitation whose expiresAt has already passed,
      // so we treat a past expiry as expired here too.
      const expiresAt = parseDate(data.expiresAt);
      const isExpired = expiresAt !== null && expiresAt.getTime() < Date.now();

      if (
        data.status === "EXPIRED" ||
        (data.status === "PENDING" && isExpired)
      ) {
        setStatusMessage("expired");
      } else if (data.status === "ACCEPTED") {
        setStatusMessage("accepted");
      } else if (data.status === "DECLINED" || data.status === "CANCELLED") {
        setStatusMessage("unavailable");
      } else {
        setStatusMessage(null);
      }
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 404) {
          setLoadError("not-found");
          setLoadErrorDetail(err.message);
        } else if (err.status === 0) {
          setLoadError("network");
        } else {
          setLoadError("other");
          setLoadErrorDetail(err.message);
        }
      } else {
        setLoadError("other");
        setLoadErrorDetail(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInvitation();
  }, [loadInvitation]);

  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (!lastname.trim()) return "Last name is required.";
    if (username.trim().length < 3)
      return "Username must be at least 3 characters.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await registerWithInvitation({
        name: name.trim(),
        lastname: lastname.trim(),
        username: username.trim(),
        password,
        token,
      });
      // On success, the auth context sets the user and App renders the dashboard.
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading invitation…" />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--invitation">
        <div className="auth-logo">
         <div className="auth-logo-icon">L</div>
         <div className="auth-logo-text">Logis</div>
        </div>

        {loadError === "not-found" ? (
          <>
            <h1 className="auth-title">This invitation could not be found.</h1>
            <p className="auth-subtitle">
              The link may be incorrect or the invitation has been removed. Ask
              a company manager to send you a new invitation.
            </p>
          </>
        ) : loadError === "network" ? (
          <>
            <h1 className="auth-title">Unable to load the invitation.</h1>
            <p className="auth-subtitle">
              Could not reach the server. Please check your internet connection
              and try again.
            </p>
          </>
        ) : loadError === "other" ? (
          <>
            <h1 className="auth-title">Something went wrong.</h1>
            <p className="auth-subtitle">
              {loadErrorDetail ||
                "An unexpected error occurred while loading the invitation. Please try again."}
            </p>
          </>
        ) : statusMessage === "expired" ? (
          <>
            <h1 className="auth-title">This invitation has expired.</h1>
            <p className="auth-subtitle">
              Ask a company manager to send you a new invitation.
            </p>
          </>
        ) : statusMessage === "accepted" ? (
          <>
            <h1 className="auth-title">
              This invitation has already been used.
            </h1>
            <p className="auth-subtitle">
              Ask a company manager to send you a new invitation if you believe
              this is a mistake.
            </p>
          </>
        ) : statusMessage === "unavailable" ? (
          <>
            <h1 className="auth-title">This invitation is no longer valid.</h1>
            <p className="auth-subtitle">
              Ask a company manager to send you a new invitation.
            </p>
          </>
        ) : invitation && !invitation.userExists ? (
          // ── New user: invitation registration form ────
          <>
            <div className="company-badge">
              <span className="company-badge-icon">🏢</span>
              {invitation.companyName}
            </div>
            <h1 className="auth-title">
              You've been invited to join {invitation.companyName}
            </h1>
            <p className="auth-subtitle">
              This invitation was sent to:
              <br />
              <strong>{invitation.email}</strong>
            </p>
            <p className="auth-subtitle">
             Create your Logis account to join {invitation.companyName}.
            </p>

            {formError && (
              <div style={{ marginBottom: 16 }}>
                <Alert>{formError}</Alert>
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-name">
                    Name
                  </label>
                  <input
                    id="inv-name"
                    type="text"
                    className="form-input"
                    placeholder="Karolis"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="given-name"
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-lastname">
                    Last name
                  </label>
                  <input
                    id="inv-lastname"
                    type="text"
                    className="form-input"
                    placeholder="Petrauskas"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    autoComplete="family-name"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="inv-username">
                  Username
                </label>
                <input
                  id="inv-username"
                  type="text"
                  className="form-input"
                  placeholder="karolis"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="inv-email">
                  Email
                </label>
                <input
                  id="inv-email"
                  type="email"
                  className="form-input"
                  value={invitation.email}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="inv-password">
                  Password
                </label>
                <input
                  id="inv-password"
                  type="password"
                  className="form-input"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="inv-confirm-password">
                  Confirm password
                </label>
                <input
                  id="inv-confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={submitting}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
                disabled={submitting}
              >
                {submitting ? "Creating account…" : "Create account"}
              </button>
            </form>
          </>
        ) : (
          // ── Existing Logis user: go sign in, accept via Invites tab ────
          <>
            <div className="company-badge">
              <span className="company-badge-icon">🏢</span>
              {invitation!.companyName}
            </div>
            <h1 className="auth-title">
              You've been invited to join {invitation!.companyName}
            </h1>
            <p className="auth-subtitle">
              This invitation was sent to:
              <br />
              <strong>{invitation!.email}</strong>
            </p>
            <p className="auth-subtitle">You already have a Logis account.</p>
            <p className="auth-subtitle">
              Sign in with your account — you can accept this invitation from
              the <strong>Invites</strong> tab afterwards.
            </p>
            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={onGoToLogin}
            >
              Go to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
