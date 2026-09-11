import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { getErrorMessage, invitationsApi, isApiError } from "../api";
import type { InvitationResponse, Language } from "../types";
import { Alert, LoadingState } from "../components";
import { parseDate } from "../utils";
import { useI18n } from "../i18n";
import type { TranslationKey } from "../translations";

const LANGUAGE_OPTIONS: {
  value: Language;
  code: string;
  flag: string;
  labelKey: TranslationKey;
}[] = [
  { value: "EN", code: "EN", flag: "🇬🇧", labelKey: "languageEnglish" },
  { value: "LT", code: "LT", flag: "🇱🇹", labelKey: "languageLithuanian" },
];

interface InvitationPageProps {
  token: string;
  onGoToLogin: () => void;
}

type LoadErrorType = "not-found" | "network" | "other";

export default function InvitationPage({
  token,
  onGoToLogin,
}: InvitationPageProps) {
  const { registerWithInvitation } = useAuth();
  const { t, language, setLanguage } = useI18n();

  const [invitation, setInvitation] = useState<InvitationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadErrorType | null>(null);
  const [loadErrorDetail, setLoadErrorDetail] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
    if (!name.trim()) return t("signupErrorNameRequired");
    if (!lastname.trim()) return t("signupErrorLastNameRequired");
    if (username.trim().length < 3) return t("signupErrorUsernameShort");
    if (password.length < 8) return t("signupErrorPasswordShort");
    if (password !== confirmPassword) return t("signupErrorPasswordMatch");
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
        language,
      });
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState label={t("loadingInvitation")} />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--invitation">
        <div
          className="auth-lang-switch"
          role="group"
          aria-label={t("signupLanguageLabel")}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                "auth-lang-option" +
                (language === option.value ? " active" : "")
              }
              onClick={() => setLanguage(option.value, false)}
              aria-pressed={language === option.value}
              aria-label={t(option.labelKey)}
              title={t(option.labelKey)}
            >
              <span aria-hidden="true">{option.flag}</span>
              {option.code}
            </button>
          ))}
        </div>

        <div className="auth-logo">
          <div className="auth-logo-icon">L</div>
          <div className="auth-logo-text">Logis</div>
        </div>

        {loadError === "not-found" ? (
          <>
            <h1 className="auth-title">{t("invitationNotFoundTitle")}</h1>
            <p className="auth-subtitle">{t("invitationNotFoundDesc")}</p>
          </>
        ) : loadError === "network" ? (
          <>
            <h1 className="auth-title">{t("invitationNetworkErrorTitle")}</h1>
            <p className="auth-subtitle">{t("invitationNetworkErrorDesc")}</p>
          </>
        ) : loadError === "other" ? (
          <>
            <h1 className="auth-title">{t("invitationGenericErrorTitle")}</h1>
            <p className="auth-subtitle">
              {loadErrorDetail || t("invitationGenericErrorTitle")}
            </p>
          </>
        ) : statusMessage === "expired" ? (
          <>
            <h1 className="auth-title">{t("invitationExpiredTitle")}</h1>
            <p className="auth-subtitle">{t("invitationExpiredDesc")}</p>
          </>
        ) : statusMessage === "accepted" ? (
          <>
            <h1 className="auth-title">{t("invitationUsedTitle")}</h1>
            <p className="auth-subtitle">{t("invitationUsedDesc")}</p>
          </>
        ) : statusMessage === "unavailable" ? (
          <>
            <h1 className="auth-title">{t("invitationUnavailableTitle")}</h1>
            <p className="auth-subtitle">{t("invitationUnavailableDesc")}</p>
          </>
        ) : invitation && !invitation.userExists ? (
          <>
            <div className="company-badge">
              <span className="company-badge-icon">🏢</span>
              {invitation.companyName}
            </div>
            <h1 className="auth-title">
              {t("invitationNewUserTitle", { company: invitation.companyName })}
            </h1>
            <p className="auth-subtitle">
              {t("invitationNewUserSentTo", { email: invitation.email })}
            </p>
            <p className="auth-subtitle">
              {t("invitationNewUserCreateAccount", {
                company: invitation.companyName,
              })}
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
                    {t("signupName")}
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
                    {t("signupLastName")}
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
                  {t("signupUsername")}
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
                  {t("signupEmail")}
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
                  {t("signupPassword")}
                </label>
                <input
                  id="inv-password"
                  type="password"
                  className="form-input"
                  placeholder={t("signupPasswordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="inv-confirm-password">
                  {t("signupConfirmPassword")}
                </label>
                <input
                  id="inv-confirm-password"
                  type="password"
                  className="form-input"
                  placeholder={t("signupConfirmPasswordPlaceholder")}
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
                {submitting
                  ? t("invitationNewUserSubmitting")
                  : t("invitationNewUserSubmit")}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="company-badge">
              <span className="company-badge-icon">🏢</span>
              {invitation!.companyName}
            </div>
            <h1 className="auth-title">
              {t("invitationExistingUserTitle", {
                company: invitation!.companyName,
              })}
            </h1>
            <p className="auth-subtitle">
              {t("invitationNewUserSentTo", { email: invitation!.email })}
            </p>
            <p className="auth-subtitle">{t("invitationExistingUserDesc")}</p>
            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={onGoToLogin}
            >
              {t("invitationGoToSignIn")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
