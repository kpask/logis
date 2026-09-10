import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { companiesApi, getErrorMessage } from "../api";
import type { CompanyResponse } from "../types";
import { Alert } from "../components";
import { getInitials } from "../utils";
import { useI18n } from "../i18n";

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useI18n();
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
    <div className="page-container page-container--form">
      <div className="page-header">
        <div>
          <h1 className="page-header-title">{t("profileTitle")}</h1>
          <p className="page-header-subtitle">{t("profileSubtitle")}</p>
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
                {t("profileEmail")}
              </div>
              <div style={{ fontWeight: 500 }}>{user.email}</div>
            </div>
            <div>
              <div className="muted small" style={{ marginBottom: 2 }}>
                {t("profileName")}
              </div>
              <div style={{ fontWeight: 500 }}>{user.name}</div>
            </div>
            <div>
              <div className="muted small" style={{ marginBottom: 2 }}>
                {t("profileLastName")}
              </div>
              <div style={{ fontWeight: 500 }}>{user.lastname}</div>
            </div>
            <div>
              <div className="muted small" style={{ marginBottom: 2 }}>
                {t("profileUsername")}
              </div>
              <div style={{ fontWeight: 500 }}>@{user.username}</div>
            </div>
            <div>
              <div className="muted small" style={{ marginBottom: 2 }}>
                {t("profileRole")}
              </div>
              {user.companyRole === "OWNER" ? (
                <span className="badge badge-primary">{t("roleOwner")}</span>
              ) : user.companyRole === "MANAGER" ? (
                <span className="badge badge-primary">{t("roleManager")}</span>
              ) : (
                <span className="badge badge-muted">{t("roleWorker")}</span>
              )}
            </div>
            <div>
              <div className="muted small" style={{ marginBottom: 2 }}>
                {t("profileCompany")}
              </div>
              {loading ? (
                <div className="muted small">{t("profileLoadingCompany")}</div>
              ) : company ? (
                <div style={{ fontWeight: 500 }}>{company.name}</div>
              ) : (
                <div className="muted" style={{ fontWeight: 500 }}>
                  {t("profileNoCompany")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
