import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { companiesApi, getErrorMessage, workplacesApi } from "../api";
import type { CompanyResponse, Location, WorkplaceResponse } from "../types";
import {
  Alert,
  DropdownMenu,
  EmptyState,
  IconBuilding,
  IconMapPin,
  IconPlus,
  LoadingState,
  Modal,
} from "../components";
import type { DropdownMenuItem } from "../components";
import MapPicker from "../MapPicker";
import { isManagerOrHigher } from "../utils";

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
  const [workplaceLocation, setWorkplaceLocation] = useState<Location | null>(
    null
  );
  const [workplaceRadius, setWorkplaceRadius] = useState(150);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [workplaceSubmitting, setWorkplaceSubmitting] = useState(false);
  const [workplaceError, setWorkplaceError] = useState<string | null>(null);

  const [workplaceDeletingId, setWorkplaceDeletingId] = useState<number | null>(
    null
  );
  const [workplaceDeleteError, setWorkplaceDeleteError] = useState<
    string | null
  >(null);

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
        location: showLocationPicker ? workplaceLocation : null,
        radiusDistance: showLocationPicker ? workplaceRadius : null,
      });
      setWorkplaces((prev) => [...prev, created]);
      setShowCreateWorkplace(false);
      setWorkplaceName("");
      setWorkplaceLocation(null);
      setWorkplaceRadius(150);
      setShowLocationPicker(false);
    } catch (err) {
      setWorkplaceError(getErrorMessage(err));
    } finally {
      setWorkplaceSubmitting(false);
    }
  }

  async function handleDeleteWorkplace(wp: WorkplaceResponse) {
    const confirmed = window.confirm(
      `Delete "${wp.name}"? This will permanently remove the workplace and all of its projects and time entries.`
    );
    if (!confirmed) return;

    setWorkplaceDeleteError(null);
    setWorkplaceDeletingId(wp.id);
    try {
      await workplacesApi.delete(wp.id);
      setWorkplaces((prev) => prev.filter((w) => w.id !== wp.id));
    } catch (err) {
      setWorkplaceDeleteError(getErrorMessage(err));
    } finally {
      setWorkplaceDeletingId(null);
    }
  }

  function workplaceActions(wp: WorkplaceResponse): DropdownMenuItem[] {
    return [
      {
        label: "Delete",
        danger: true,
        disabled: workplaceDeletingId === wp.id,
        onSelect: () => handleDeleteWorkplace(wp),
      },
    ];
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
        {isManagerOrHigher(user?.companyRole) && (
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
              isManagerOrHigher(user?.companyRole) ? (
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
              {isManagerOrHigher(user?.companyRole) && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ flexShrink: 0 }}
                >
                  <DropdownMenu
                    items={workplaceActions(wp)}
                    disabled={workplaceDeletingId === wp.id}
                    title="Workplace actions"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {workplaceDeleteError && (
        <div className="card" style={{ marginTop: 16 }}>
          <Alert>{workplaceDeleteError}</Alert>
        </div>
      )}

      {showCreateWorkplace && (
        <Modal
          title="Create workplace"
          description="A workplace is a physical or virtual location where projects happen."
          onClose={() => {
            setShowCreateWorkplace(false);
            setWorkplaceName("");
            setWorkplaceLocation(null);
            setWorkplaceRadius(150);
            setShowLocationPicker(false);
            setWorkplaceError(null);
          }}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateWorkplace(false);
                  setWorkplaceName("");
                  setWorkplaceLocation(null);
                  setWorkplaceRadius(150);
                  setShowLocationPicker(false);
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateWorkplace();
            }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="workplace-name">
                Name
              </label>
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

            <div className="form-group">
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={showLocationPicker}
                  onChange={(e) => {
                    setShowLocationPicker(e.target.checked);
                    if (!e.target.checked) {
                      setWorkplaceLocation(null);
                    }
                  }}
                  disabled={workplaceSubmitting}
                />
                Set a location for this workplace
              </label>
              {showLocationPicker && (
                <div style={{ marginTop: 12 }}>
                  <MapPicker
                    value={workplaceLocation}
                    onChange={setWorkplaceLocation}
                    radiusMeters={workplaceRadius}
                  />
                  <div style={{ marginTop: 12 }}>
                    <label className="form-label" htmlFor="workplace-radius">
                      Clock-in fence radius:{" "}
                      <strong>{workplaceRadius} m</strong>
                    </label>
                    <input
                      id="workplace-radius"
                      type="range"
                      min={50}
                      max={2000}
                      step={10}
                      className="form-input"
                      value={workplaceRadius}
                      onChange={(e) =>
                        setWorkplaceRadius(Number(e.target.value))
                      }
                      disabled={workplaceSubmitting}
                    />
                    <div className="muted small">
                      Workers must be within this distance for their time entry
                      to be logged as on-site. Entries outside are still allowed
                      but flagged.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
