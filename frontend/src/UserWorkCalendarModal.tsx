import { useEffect, useMemo, useState } from "react";
import { getErrorMessage, timeTrackingApi, workplacesApi } from "./api";
import type { ProjectResponse, TimeEntryResponse, UserResponse } from "./types";
import {
  Alert,
  EmptyState,
  IconClock,
  LoadingState,
  Modal,
  MonthCalendar,
} from "./components";
import {
  effectiveDurationSeconds,
  formatDuration,
  formatDurationHuman,
  formatMonthDay,
  formatTime,
  toDateKey,
} from "./utils";

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
  const [entries, setEntries] = useState<TimeEntryResponse[]>([]);
  const [projectNames, setProjectNames] = useState<Map<number, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        // All of the member's entries across every project. Authorization
        // (manager of the same company) is enforced by the backend.
        const userEntries = await timeTrackingApi.getByUser(member.id);

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

  // Only completed (stopped) entries count toward worked days/totals.
  const completedEntries = useMemo(
    () => entries.filter((e) => e.endTime),
    [entries]
  );

  const workedDays = useMemo(
    () =>
      new Set(completedEntries.map((e) => toDateKey(new Date(e.startTime)))),
    [completedEntries]
  );

  const monthTotalSeconds = useMemo(
    () =>
      completedEntries
        .filter((e) => {
          const d = new Date(e.startTime);
          return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
        })
        .reduce(
          (sum, entry) =>
            sum + effectiveDurationSeconds(entry.duration, entry.lunchLength),
          0
        ),
    [completedEntries, viewYear, viewMonth]
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

  const selectedTotalSeconds = selectedEntries.reduce(
    (sum, entry) =>
      sum + effectiveDurationSeconds(entry.duration, entry.lunchLength),
    0
  );

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
      title={`Work calendar — ${member.name} ${member.lastname}`}
      description="Logged time across all projects. Click a marked day to see its entries."
      onClose={onClose}
    >
      {loading && <LoadingState label="Loading work calendar…" />}

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
            <h4 style={{ margin: 0 }}>{formatMonthDay(selectedDate)}</h4>
            {selectedEntries.length > 0 && (
              <span className="badge badge-primary">
                {formatDurationHuman(selectedTotalSeconds)} logged
              </span>
            )}
          </div>

          {selectedEntries.length === 0 ? (
            <EmptyState
              icon={<IconClock />}
              title="No time logged on this day."
              description="Click any worked day in the calendar to see its entries."
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Start</th>
                    <th>End</th>
                    <th>Lunch</th>
                    <th>Worked</th>
                    <th>Project</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatTime(entry.startTime)}</td>
                      <td>{formatTime(entry.endTime)}</td>
                      <td className="muted">{entry.lunchLength}m</td>
                      <td style={{ fontWeight: 500 }}>
                        {formatDuration(
                          effectiveDurationSeconds(
                            entry.duration,
                            entry.lunchLength
                          )
                        )}
                      </td>
                      <td className="muted">
                        {projectNames.get(entry.projectId) ??
                          `Project #${entry.projectId}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ fontWeight: 600 }}>
                      Total
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {formatDurationHuman(selectedTotalSeconds)}
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
