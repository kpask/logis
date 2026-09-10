import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { getErrorMessage } from "../api";
import { Alert } from "../components";
import { useI18n } from "../i18n";

export default function SignupPage({
  onNavigateLogin,
}: {
  onNavigateLogin: () => void;
}) {
  const { register } = useAuth();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (!name.trim()) return t("signupErrorNameRequired");
    if (!lastname.trim()) return t("signupErrorLastNameRequired");
    if (username.trim().length < 3) return t("signupErrorUsernameShort");
    if (!email.trim() || !email.includes("@"))
      return t("signupErrorEmailInvalid");
    if (password.length < 8) return t("signupErrorPasswordShort");
    if (password !== confirmPassword) return t("signupErrorPasswordMatch");
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        lastname: lastname.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">L</div>
          <div className="auth-logo-text">Logis</div>
        </div>

        <h1 className="auth-title">{t("signupTitle")}</h1>
        <p className="auth-subtitle">{t("signupSubtitle")}</p>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <Alert>{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                {t("signupName")}
              </label>
              <input
                id="name"
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
              <label className="form-label" htmlFor="lastname">
                {t("signupLastName")}
              </label>
              <input
                id="lastname"
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
            <label className="form-label" htmlFor="username">
              {t("signupUsername")}
            </label>
            <input
              id="username"
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
            <label className="form-label" htmlFor="email">
              {t("signupEmail")}
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              {t("signupPassword")}
            </label>
            <input
              id="password"
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
            <label className="form-label" htmlFor="confirm-password">
              {t("signupConfirmPassword")}
            </label>
            <input
              id="confirm-password"
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
            {submitting ? t("signupSubmitting") : t("signupSubmit")}
          </button>
        </form>

        <div className="auth-footer">
          {t("signupHasAccount")}{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigateLogin();
            }}
          >
            {t("signupSignIn")}
          </a>
        </div>
      </div>
    </div>
  );
}
