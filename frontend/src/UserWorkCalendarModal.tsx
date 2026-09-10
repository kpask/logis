import { useEffect, useMemo, useState } from "react";
import { getErrorMessage, timeTrackingApi, workplacesApi } from "./api";
import type {
  ProjectResponse,
  TimeEntryResponse,
  TimeWorkedResponse,
  UserResponse,
} from "./types";
import {
  Alert,
  EmptyState,
  IconClock,
  LoadingState,
  Modal,
  MonthCalendar,
} from "./components";
import {
  durationToSeconds,
  formatDuration,
  formatDurationHuman,
  formatMonthDay,
  formatTime,
  toDateKey,
  workedSecondsForDate,
  workedSecondsInMonth,
} from "./utils";
import { useI18n } from "./i18n";

interface UserWorkCalendarModalProps {
  member: UserResponse;
  onClose: () => void;
}

/**
 * Popup showing a company member's logged work across ALL projects on a
 * month calendar. Reuses the same MonthCalendar + day-entries pattern as
 * the project view. The backend only allows viewing another member's
 * entries for managers of the same company.
 */
export default function UserWorkCalendarModal({
  member,
  onClose,
}: UserWorkCalendarModalProps) {
  const { t, language } = useI18n();
  const [entries, setEntries] = useState<TimeEntryResponse[]>([]);
  const [projectNames, setProjectNames] = useState<Map<number, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Per-day worked time computed by the backend (lunch already deducted) —
  // the frontend only displays these rows.
  const [timeWorked, setTimeWorked] = useState<TimeWorkedResponse[]>([]);

  // Calendar state (same pattern as the project view)
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(today));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // All of the member's entries across every project, plus the
        // backend-computed per-day worked rows. Authorization (manager of
        // the same company) is enforced by the backend.
        const [userEntries, workedRows] = await Promise.all([
          timeTrackingApi.getByUser(member.id),
          timeTrackingApi.getTimeWorkedByUser(member.id),
        ]);

        // Resolve project names by walking the company's workplaces and
        // their projects, so each entry can display what it was worked on.
        const names = new Map<number, string>();
        try {
          const wps = await workplacesApi.getMine();
          const projectLists = await Promise.all(
            wps.map((wp) => workplacesApi.getProjects(wp.id))
          );
          for (const projects of projectLists as ProjectResponse[][]) {
            for (const p of projects) {
              names.set(p.id, p.projectName);
            }
          }
        } catch {
          // Names are a nice-to-have; entries still render with a fallback.
        }

        if (!cancelled) {
          setEntries(userEntries);
          setTimeWorked(workedRows);
          setProjectNames(names);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [member.id]);

  // Only completed (stopped) entries are listed in the day table.
  const completedEntries = useMemo(
    () => entries.filter((e) => e.endTime),
    [entries]
  );

  // Days that have at least one logged entry (red on the calendar), from the
  // backend-computed worked rows.
  const workedDays = useMemo(
    () => new Set(timeWorked.map((row) => row.date)),
    [timeWorked]
  );

  // Total worked within the displayed month — read straight from the
  // backend's rows (company rules like the lunch deduction are applied there).
  const monthTotalSeconds = useMemo(
    () => workedSecondsInMonth(timeWorked, viewYear, viewMonth),
    [timeWorked, viewYear, viewMonth]
  );

  const selectedEntries = useMemo(
    () =>
      completedEntries
        .filter((e) => toDateKey(new Date(e.startTime)) === selectedDate)
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ),
    [completedEntries, selectedDate]
  );

  // Total worked for the selected day.
  const selectedTotalSeconds = workedSecondsForDate(timeWorked, selectedDate);

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

  return (
    <Modal
      title={t("workCalendarTitle", {
        name: member.name,
        lastname: member.lastname,
      })}
      description={t("workCalendarDesc")}
      onClose={onClose}
    >
      {loading && <LoadingState label={t("loadingWorkCalendar")} />}

      {!loading && error && <Alert>{error}</Alert>}

      {!loading && !error && (
        <>
          <MonthCalendar
            viewYear={viewYear}
            viewMonth={viewMonth}
            onPrevMonth={goToPrevMonth}
            onNextMonth={goToNextMonth}
            workedDays={workedDays}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            monthTotalSeconds={monthTotalSeconds}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              margin: "20px 0 12px",
              flexWrap: "wrap",
            }}
          >
            <h4 style={{ margin: 0 }}>
              {formatMonthDay(selectedDate, language)}
            </h4>
            {selectedEntries.length > 0 && (
              <span className="badge badge-primary">
                {t("workCalendarLoggedBadge", {
                  time: formatDurationHuman(selectedTotalSeconds, language),
                })}
              </span>
            )}
          </div>

          {selectedEntries.length === 0 ? (
            <EmptyState
              icon={<IconClock />}
              title={t("workCalendarNoTimeTitle")}
              description={t("workCalendarNoTimeDesc")}
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("colStart")}</th>
                    <th>{t("colEnd")}</th>
                    <th>{t("colWorked")}</th>
                    <th>{t("colProject")}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatTime(entry.startTime, language)}</td>
                      <td>{formatTime(entry.endTime, language)}</td>
                      <td style={{ fontWeight: 500 }}>
                        {formatDuration(
                          durationToSeconds(entry.duration),
                          language
                        )}
                      </td>
                      <td className="muted">
                        {projectNames.get(entry.projectId) ??
                          t("workCalendarProjectFallback", {
                            id: entry.projectId,
                          })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} style={{ fontWeight: 600 }}>
                      {t("workCalendarTotal")}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {formatDurationHuman(selectedTotalSeconds, language)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
