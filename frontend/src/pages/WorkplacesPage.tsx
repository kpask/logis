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
  IconPlus,
  LoadingState,
  Modal,
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

  const [showCreateWorkplace, setShowCreateWorkplace] = useState(false);
  const [workplaceName, setWorkplaceName] = useState("");
  const [workplaceSubmitting, setWorkplaceSubmitting] = useState(false);
  const [workplaceError, setWorkplaceError] = useState<string | null>(null);

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

  async function handleCreateWorkplace() {
    if (!workplaceName.trim()) {
      setWorkplaceError("Workplace name is required.");
      return;
    }

    setWorkplaceSubmitting(true);
    setWorkplaceError(null);

    try {
      const created = await workplacesApi.create({
        name: workplaceName.trim(),
        location: null,
      });
      setWorkplaces((prev) => [...prev, created]);
      setShowCreateWorkplace(false);
      setWorkplaceName("");
    } catch (err) {
      setWorkplaceError(getErrorMessage(err));
    } finally {
      setWorkplaceSubmitting(false);
    }
  }

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
    <div className="page-container page-container--compact">
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Workplaces</h1>
          <p className="page-header-subtitle">
            {company.name} · {workplaces.length}{" "}
            {workplaces.length === 1 ? "workplace" : "workplaces"}
          </p>
        </div>
        {user?.companyRole === "MANAGER" && (
          <div className="page-header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateWorkplace(true)}
            >
              <IconPlus />
              Create workplace
            </button>
          </div>
        )}
      </div>

      {workplaces.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconBuilding />}
            title="No workplaces yet."
            description="Create a workplace to start organizing projects."
            actions={
              user?.companyRole === "MANAGER" ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateWorkplace(true)}
                >
                  <IconPlus />
                  Create workplace
                </button>
              ) : undefined
            }
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

      {showCreateWorkplace && (
        <Modal
          title="Create workplace"
          description="A workplace is a physical or virtual location where projects happen."
          onClose={() => {
            setShowCreateWorkplace(false);
            setWorkplaceName("");
            setWorkplaceError(null);
          }}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateWorkplace(false);
                  setWorkplaceName("");
                  setWorkplaceError(null);
                }}
                disabled={workplaceSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateWorkplace}
                disabled={workplaceSubmitting}
              >
                {workplaceSubmitting ? "Creating…" : "Create workplace"}
              </button>
            </>
          }
        >
          {workplaceError && (
            <div style={{ marginBottom: 16 }}>
              <Alert>{workplaceError}</Alert>
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); handleCreateWorkplace(); }}>
            <div className="form-group">
              <label className="form-label" htmlFor="workplace-name">Name</label>
              <input
                id="workplace-name"
                type="text"
                className="form-input"
                placeholder="e.g. Vilnius Office"
                value={workplaceName}
                onChange={(e) => setWorkplaceName(e.target.value)}
                disabled={workplaceSubmitting}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
