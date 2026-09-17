import { useCallback, useEffect, useMemo, useState } from "react";
import {
  companiesApi,
  downloadBlob,
  getErrorMessage,
  timeTrackingApi,
  type ExportDownload,
  type ExportFormat,
} from "../api";
import type { TimeWorkedResponse, UserResponse } from "../types";
import {
  Alert,
  EmptyState,
  IconClock,
  LoadingState,
  MemberSelect,
  type MemberFilterValue,
} from "../components";
import {
  durationToSeconds,
  formatDate,
  formatDuration,
  formatDurationHuman,
  isManagerOrHigher,
  workedSecondsInMonth,
} from "../utils";
import { useAuth } from "../auth";
import { useI18n } from "../i18n";

/**
 * Work-hours statistics & export page.
 *
 * - Everyone: a 12-month bar overview, a month stepper with a per-day
 *   table, and PDF/CSV exports (viewed month or all recorded time).
 * - Managers additionally get a member dropdown next to the month table:
 *   selecting a worker shows *their* per-day rows for the viewed month
 *   (from the one /company/time-worked fetch — filtered client-side) and
 *   the export buttons then target that worker. "All" means your own rows.
 *
 * All numbers come from the backend's per-day worked rows — the page only
 * slices and displays them.
 *
 * NOTE on months: the stepper uses JS's 0-based Date#getMonth(), while the
 * export endpoints take a 1-based month — always pass `viewMonth + 1`.
 */
export default function TimeWorkedPage() {
  const { user } = useAuth();
  const { t, language } = useI18n();

  const [myRows, setMyRows] = useState<TimeWorkedResponse[]>([]);
  const [companyRows, setCompanyRows] = useState<TimeWorkedResponse[] | null>(
    null
  );
  const [members, setMembers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Viewed month (stepper), same pattern as the calendar views.
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Manager member filter: "all" = my own rows, a number = that worker's id.
  const [selectedMember, setSelectedMember] =
    useState<MemberFilterValue>("all");

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const isManager = isManagerOrHigher(user?.companyRole);

  const hasCompany = user?.companyId != null;

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    // Without a company the backend rejects these calls — skip the fetch
    // entirely and let the page render its empty state instead.
    if (user.companyId == null) {
      setMyRows([]);
      setCompanyRows(null);
      setMembers([]);
      setLoading(false);
      return;
    }
    try {
      // Full history once — months are sliced client-side, exactly like
      // the calendar views do.
      const my = await timeTrackingApi.getMyTimeWorked();
      setMyRows(my);

      if (isManagerOrHigher(user.companyRole)) {
        try {
          const [company, memberList] = await Promise.all([
            timeTrackingApi.getCompanyTimeWorked(),
            companiesApi.getMembers(),
          ]);
          setCompanyRows(company);
          setMembers(memberList);
        } catch {
          // The dropdown is a manager extra — never block the page.
          setCompanyRows(null);
          setMembers([]);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset the member filter when switching accounts.
  useEffect(() => {
    setSelectedMember("all");
  }, [user?.id]);

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  // ── Rows shown in the table (own or the selected worker's) ──────

  const activeUserId =
    selectedMember === "all" ? user?.id ?? 0 : selectedMember;

  const activeRows = useMemo(() => {
    if (selectedMember === "all") return myRows;
    return (companyRows ?? []).filter((row) => row.userId === selectedMember);
  }, [selectedMember, myRows, companyRows]);

  const memberNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of members) {
      map.set(m.id, `${m.name} ${m.lastname}`);
    }
    return map;
  }, [members]);

  const viewedMonthSeconds = useMemo(
    () => workedSecondsInMonth(activeRows, viewYear, viewMonth),
    [activeRows, viewYear, viewMonth]
  );

  const viewedMonthRows = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    return activeRows
      .filter((row) => row.date.startsWith(prefix))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [activeRows, viewYear, viewMonth]);

  // Last 12 months (own hours), oldest first, for the bar overview.
  const last12Months = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(
      language === "LT" ? "lt-LT" : "en-GB",
      { month: "short", year: "2-digit" }
    );
    const months: { key: string; label: string; seconds: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: formatter.format(d),
        seconds: workedSecondsInMonth(myRows, d.getFullYear(), d.getMonth()),
      });
    }
    return months;
  }, [myRows, language]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxMonthSeconds = Math.max(...last12Months.map((m) => m.seconds), 1);

  const viewedMonthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "LT" ? "lt-LT" : "en-GB", {
        month: "long",
        year: "numeric",
      }).format(new Date(viewYear, viewMonth, 1)),
    [viewYear, viewMonth, language]
  );

  // ── Exports (viewMonth is 0-based; the API expects a 1-based month) ─

  async function runExport(download: () => Promise<ExportDownload>) {
    setExportError(null);
    setExporting(true);
    try {
      const { blob, fileName } = await download();
      downloadBlob(blob, fileName);
    } catch (err) {
      setExportError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  const exportViewedMonth = (format: ExportFormat) =>
    runExport(() =>
      selectedMember === "all"
        ? timeTrackingApi.exportMyTimeWorked(format, viewYear, viewMonth + 1)
        : timeTrackingApi.exportUserTimeWorked(
            activeUserId,
            format,
            viewYear,
            viewMonth + 1
          )
    );

  const exportAllTime = (format: ExportFormat) =>
    runExport(() =>
      selectedMember === "all"
        ? timeTrackingApi.exportMyTimeWorked(format)
        : timeTrackingApi.exportUserTimeWorked(activeUserId, format)
    );

  if (loading) {
    return <LoadingState label={t("hoursLoading")} />;
  }

  if (!hasCompany) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-header-title">{t("hoursTitle")}</h1>
            <p className="page-header-subtitle">{t("hoursSubtitle")}</p>
          </div>
        </div>
        <div className="card">
          <EmptyState
            icon={<IconClock />}
            title={t("hoursNoCompanyTitle")}
            description={t("hoursNoCompanyDesc")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-header-title">{t("hoursTitle")}</h1>
          <p className="page-header-subtitle">{t("hoursSubtitle")}</p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16 }}>
          <Alert>{error}</Alert>
        </div>
      )}
      {exportError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <Alert>{exportError}</Alert>
        </div>
      )}

      {/* 12-month overview (own hours) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>
          {t("hoursMonthlyTitle")}
        </h3>
        {myRows.length === 0 ? (
          <EmptyState
            icon={<IconClock />}
            title={t("hoursNoDataTitle")}
            description={t("hoursNoDataDesc")}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {last12Months.map((m) => (
              <div
                key={m.key}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <span
                  className="muted small"
                  style={{ width: 84, flexShrink: 0 }}
                >
                  {m.label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 10,
                    borderRadius: 6,
                    background: "var(--color-primary-soft)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(m.seconds / maxMonthSeconds) * 100}%`,
                      height: "100%",
                      borderRadius: 6,
                      background: "var(--color-primary)",
                    }}
                  />
                </div>
                <span
                  className="small"
                  style={{ width: 90, textAlign: "right", flexShrink: 0 }}
                >
                  {formatDurationHuman(m.seconds, language)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Viewed month: member filter (managers) + per-day table + exports */}
      <div
        className="section-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0 }}>{viewedMonthLabel}</h2>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={goToPrevMonth}
            aria-label={t("hoursPrevMonth")}
          >
            ←
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={goToNextMonth}
            aria-label={t("hoursNextMonth")}
          >
            →
          </button>
        </div>
        {isManager && members.length > 0 && (
          <MemberSelect
            members={members}
            value={selectedMember}
            onChange={setSelectedMember}
          />
        )}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span className="badge badge-primary">
            {t("loggedSuffix", {
              time: formatDurationHuman(viewedMonthSeconds, language),
            })}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={exporting}
            onClick={() => exportViewedMonth("pdf")}
          >
            {t("hoursExportPdf")}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={exporting}
            onClick={() => exportViewedMonth("csv")}
          >
            {t("hoursExportCsv")}
          </button>
        </div>
      </div>

      {selectedMember !== "all" && (
        <p className="muted small" style={{ margin: "0 0 12px" }}>
          {memberNameById.get(selectedMember) ??
            t("hoursUnknownUser", { id: selectedMember })}
        </p>
      )}

      {viewedMonthRows.length === 0 ? (
        <div className="card" style={{ marginBottom: 24 }}>
          <EmptyState
            icon={<IconClock />}
            title={t("hoursNoMonthDataTitle")}
            description={t("hoursNoMonthDataDesc")}
          />
        </div>
      ) : (
        <div
          className="card table-scroll"
          style={{ padding: 0, marginBottom: 24 }}
        >
          <table className="table">
            <thead>
              <tr>
                <th>{t("colDate")}</th>
                <th>{t("colTracked")}</th>
                <th>{t("colWorked")}</th>
              </tr>
            </thead>
            <tbody>
              {viewedMonthRows.map((row) => (
                <tr key={`${row.userId}-${row.date}`}>
                  <td>{formatDate(row.date, language)}</td>
                  <td>
                    {formatDuration(durationToSeconds(row.tracked), language)}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {formatDuration(durationToSeconds(row.worked), language)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 600 }}>{t("hoursTotal")}</td>
                <td colSpan={2} style={{ fontWeight: 700 }}>
                  {formatDurationHuman(viewedMonthSeconds, language)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* All-time exports for the current selection */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}
      >
        <span className="muted small" style={{ alignSelf: "center" }}>
          {t("hoursExportAll")}
        </span>
        <button
          className="btn btn-secondary btn-sm"
          disabled={exporting}
          onClick={() => exportAllTime("pdf")}
        >
          {t("hoursExportPdf")}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          disabled={exporting}
          onClick={() => exportAllTime("csv")}
        >
          {t("hoursExportCsv")}
        </button>
        {exporting && (
          <span className="muted small" style={{ alignSelf: "center" }}>
            {t("hoursExporting")}
          </span>
        )}
      </div>
    </div>
  );
}
