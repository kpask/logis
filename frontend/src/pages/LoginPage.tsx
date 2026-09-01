import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { getErrorMessage } from "../api";
import { Alert } from "../components";

interface LoginPageProps {
  onNavigateSignup: () => void;
}

export default function LoginPage({ onNavigateSignup }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      // On success, the auth context sets the user and AppContent renders
      // the dashboard automatically.
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
          <div className="auth-logo-icon">W</div>
          <div className="auth-logo-text">Workis</div>
        </div>

        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">
          Welcome back. Enter your credentials to continue.
        </p>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <Alert>{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
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
              Password
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
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSignup();
            }}
          >
            Create an account
          </a>
        </div>
      </div>
    </div>
  );
}
