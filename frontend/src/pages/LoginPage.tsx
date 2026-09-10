import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { getErrorMessage } from "../api";
import { Alert } from "../components";
import { useI18n } from "../i18n";

interface LoginPageProps {
  onNavigateSignup: () => void;
}

export default function LoginPage({ onNavigateSignup }: LoginPageProps) {
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(t("loginErrorCredentials"));
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
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

        <h1 className="auth-title">{t("loginTitle")}</h1>
        <p className="auth-subtitle">{t("loginSubtitle")}</p>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <Alert>{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              {t("loginEmail")}
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
              {t("loginPassword")}
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={submitting}
          >
            {submitting ? t("loginSubmitting") : t("loginSubmit")}
          </button>
        </form>

        <div className="auth-footer">
          {t("loginNoAccount")}{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSignup();
            }}
          >
            {t("loginCreateAccount")}
          </a>
        </div>
      </div>
    </div>
  );
}
