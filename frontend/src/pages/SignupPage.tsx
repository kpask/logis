import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { getErrorMessage } from "../api";
import { Alert } from "../components";

export default function SignupPage({
  onNavigateLogin,
}: {
  onNavigateLogin: () => void;
}) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (!lastname.trim()) return "Last name is required.";
    if (username.trim().length < 3)
      return "Username must be at least 3 characters.";
    if (!email.trim() || !email.includes("@"))
      return "Please enter a valid email.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
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

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start tracking your work in minutes.</p>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <Alert>{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Name
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
                Last name
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
              Username
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
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              id="confirm-password"
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
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigateLogin();
            }}
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
