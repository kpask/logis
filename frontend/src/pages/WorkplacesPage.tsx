import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { companiesApi, getErrorMessage, workplacesApi } from "../api";
import type { CompanyResponse, WorkplaceResponse } from "../types";
import {
  Alert,
  EmptyState,
  IconBuilding,
  IconChevronRight,
  IconMapPin,
  LoadingState,
} from "../components";

interface WorkplacesPageProps {
  onOpenWorkplace: (workplaceId: number) => void;
}

export default function WorkplacesPage({
  onOpenWorkplace,
}: WorkplacesPageProps) {
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [workplaces, setWorkplaces] = useState<WorkplaceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [comp, wps] = await Promise.all([
        companiesApi.get(user.companyId),
        workplacesApi.getMine(),
      ]);
      setCompany(comp);
      setWorkplaces(wps);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <LoadingState label="Loading workplaces…" />;
  }

  if (error) {
    return (
      <div className="card">
        <Alert>{error}</Alert>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="card">
        <EmptyState
          icon={<IconBuilding />}
          title="You're not part of a company yet."
          description="Create a company from the dashboard to start managing workplaces."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Workplaces</h1>
          <p className="page-header-subtitle">
            {company.name} · {workplaces.length}{" "}
            {workplaces.length === 1 ? "workplace" : "workplaces"}
          </p>
        </div>
      </div>

      {workplaces.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconBuilding />}
            title="No workplaces yet."
            description="Create a workplace from the dashboard to start organizing projects."
          />
        </div>
      ) : (
        <div className="grid-2">
          {workplaces.map((wp) => (
            <div
              key={wp.id}
              className="card card-hover card-clickable"
              onClick={() => onOpenWorkplace(wp.id)}
              style={{ display: "flex", alignItems: "center", gap: 16 }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "var(--color-primary-soft)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconBuilding />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{wp.name}</div>
                <div
                  className="muted small"
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <IconMapPin />
                  {wp.location?.city || "No location set"}
                </div>
              </div>
              <IconChevronRight />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
