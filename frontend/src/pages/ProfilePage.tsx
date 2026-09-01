import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { companiesApi, getErrorMessage } from "../api";
import type { CompanyResponse } from "../types";
import { Alert, IconBuilding, LoadingState } from "../components";
import { getInitials } from "../utils";

export default function ProfilePage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompany = useCallback(async () => {
    if (!user?.companyId) {
      setCompany(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await companiesApi.get(user.companyId);
      setCompany(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  if (!user) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Profile</h1>
          <p className="page-header-subtitle">Your account information</p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16 }}>
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="grid-2">
        {/* User info card */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--color-primary-soft)",
                color: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {getInitials(user.name)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 18 }}>
                {user.name} {user.lastname}
              </div>
              <div className="muted small">@{user.username}</div>
            </div>
          </div>

          <div className="divider" />

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div className="muted small" style={{ marginBottom: 2 }}>
                Email
              </div>
              <div style={{ fontWeight: 500 }}>{user.email}</div>
            </div>
            <div>
              <div className="muted small" style={{ marginBottom: 2 }}>
                Name
              </div>
              <div style={{ fontWeight: 500 }}>{user.name}</div>
            </div>
            <div>
              <div className="muted small" style={{ marginBottom: 2 }}>
                Last name
              </div>
              <div style={{ fontWeight: 500 }}>{user.lastname}</div>
            </div>
            <div>
              <div className="muted small" style={{ marginBottom: 2 }}>
                Username
              </div>
              <div style={{ fontWeight: 500 }}>@{user.username}</div>
            </div>
            <div>
              <div className="muted small" style={{ marginBottom: 2 }}>
                Role
              </div>
              {user.companyRole === "MANAGER" ? (
                <span className="badge badge-primary">Manager</span>
              ) : (
                <span className="badge badge-muted">Worker</span>
              )}
            </div>
          </div>
        </div>

        {/* Company info card */}
        <div className="card">
          <h3 style={{ margin: "0 0 16px" }}>Company</h3>

          {loading ? (
            <LoadingState label="Loading company…" />
          ) : company ? (
            <div>
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
                  }}
                >
                  <IconBuilding />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>
                    {company.name}
                  </div>
                  <div className="muted small">Your company</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="muted" style={{ padding: "8px 0" }}>
              You're not part of a company yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
