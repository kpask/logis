// ============================================================
// Workis — Shared UI components
// ============================================================

import { useEffect, useState, type ReactNode } from "react";
import type { ProjectStatus, UserResponse } from "./types";
import {
  fetchLithuanianHolidayDateKeys,
  formatDurationHuman,
  toDateKey,
} from "./utils";

// ── Loading ──────────────────────────────────────────────────

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  actions,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <div className="empty-state-title">{title}</div>
      {description && (
        <div className="empty-state-description">{description}</div>
      )}
      {actions && <div className="empty-state-actions">{actions}</div>}
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
}: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        {description && <p className="modal-description">{description}</p>}
        {children}
        {footer && <div className="modal-actions">{footer}</div>}
      </div>
    </div>
  );
}

// ── Alert ────────────────────────────────────────────────────

interface AlertProps {
  type?: "error" | "success" | "warning";
  children: ReactNode;
}

export function Alert({ type = "error", children }: AlertProps) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}

// ── Project status badge ─────────────────────────────────────

const STATUS_BADGE: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: "badge-warning" },
  ACTIVE: { label: "Active", className: "badge-success" },
  COMPLETED: { label: "Completed", className: "badge-primary" },
  CANCELLED: { label: "Cancelled", className: "badge-danger" },
  ON_HOLD: { label: "On hold", className: "badge-muted" },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const meta = STATUS_BADGE[status] ?? {
    label: status,
    className: "badge-muted",
  };
  return <span className={`badge ${meta.className}`}>{meta.label}</span>;
}

// ── Month calendar ───────────────────────────────────────────

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildCalendarCells(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Date[] = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push(new Date(year, month, -i));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  // Pad the last week with the next month's days. Day numbers greater than
  // the month length overflow into the next month (e.g. daysInMonth + 1 =>
  // 1st of next month), so count up from daysInMonth + 1.
  // Do NOT derive the next cell from the previous cell's local day number
  // (`last.getDate()`): once the previous cell has overflowed into next month
  // its day number resets to 1, so `new Date(year, month, 2)` wraps back into
  // the current month and duplicates days (e.g. August re-printed days 2-6 in
  // the trailing row, which also misplaced the weekend/holiday marks).
  for (let d = daysInMonth + 1; cells.length % 7 !== 0; d++) {
    cells.push(new Date(year, month, d));
  }
  return cells;
}

interface MonthCalendarProps {
  viewYear: number;
  viewMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  /**
   * Date keys ("YYYY-MM-DD", local timezone) that have at least one
   * completed time entry — those days are visually marked.
   */
  workedDays: Set<string>;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  /**
   * Optional total seconds worked within the displayed month.
   * When provided, a small statistic line is shown under the calendar.
   */
  monthTotalSeconds?: number;
}

/**
 * The shared month calendar used by both the workplace and project views.
 * Purely presentational — data scoping/filtering happens in the pages.
 */
export function MonthCalendar({
  viewYear,
  viewMonth,
  onPrevMonth,
  onNextMonth,
  workedDays,
  selectedDate,
  onSelectDate,
  monthTotalSeconds,
}: MonthCalendarProps) {
  const calendarCells = buildCalendarCells(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    "en-GB",
    { month: "long", year: "numeric" }
  );

  // Lithuanian public holidays for the displayed year (weekends are
  // computed locally). Loaded from the Nager.Date API with an offline
  // fallback; cached per year.
  const [holidayKeys, setHolidayKeys] = useState<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;
    fetchLithuanianHolidayDateKeys(viewYear).then((keys) => {
      if (!cancelled) setHolidayKeys(keys);
    });
    return () => {
      cancelled = true;
    };
  }, [viewYear]);

  return (
    <>
      <div className="calendar-header">
        <button
          className="btn btn-secondary btn-sm"
          onClick={onPrevMonth}
          type="button"
        >
          ← Prev
        </button>
        <div className="calendar-month">{monthLabel}</div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onNextMonth}
          type="button"
        >
          Next →
        </button>
      </div>

      <div className="calendar-grid" role="grid">
        {WEEKDAYS.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        {calendarCells.map((cell) => {
          const key = toDateKey(cell);
          const inMonth = cell.getMonth() === viewMonth;
          const isWorked = workedDays.has(key);
          const dayOfWeek = cell.getDay();
          const isNonWork =
            dayOfWeek === 0 || dayOfWeek === 6 || holidayKeys.has(key);
          const isSelected = key === selectedDate;
          const isToday = key === toDateKey(new Date());
          return (
            <button
              key={key}
              type="button"
              className={`calendar-cell${inMonth ? "" : " outside"}${
                isNonWork ? " nonwork" : ""
              }${isWorked ? " worked" : ""}${isSelected ? " selected" : ""}${
                isToday ? " today" : ""
              }`}
              onClick={() => onSelectDate(key)}
            >
              {cell.getDate()}
            </button>
          );
        })}
      </div>

      <div className="calendar-legend">
        <span>
          <span className="legend-dot worked" /> Worked
        </span>
        <span>
          <span className="legend-dot nonwork" /> Weekend / Holiday
        </span>
        <span>
          <span className="legend-dot selected" /> Selected
        </span>
      </div>

      {monthTotalSeconds !== undefined && (
        <div className="muted small" style={{ marginTop: 12 }}>
          Worked this month · {formatDurationHuman(monthTotalSeconds)}
        </div>
      )}
    </>
  );
}

// ── Member filter (managers only) ────────────────────────────

/** "all" shows every member's entries; a number filters to that user id. */
export type MemberFilterValue = number | "all";

interface MemberSelectProps {
  members: UserResponse[];
  value: MemberFilterValue;
  onChange: (value: MemberFilterValue) => void;
  disabled?: boolean;
}

/**
 * Dropdown letting a manager choose whose time entries to view.
 * Only rendered for managers — regular members never see it.
 */
export function MemberSelect({
  members,
  value,
  onChange,
  disabled,
}: MemberSelectProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <span className="muted small">Member</span>
      <select
        className="form-input"
        style={{ width: "auto" }}
        value={value === "all" ? "all" : String(value)}
        onChange={(e) =>
          onChange(e.target.value === "all" ? "all" : Number(e.target.value))
        }
        disabled={disabled}
      >
        <option value="all">All members</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name} {member.lastname}
          </option>
        ))}
      </select>
    </label>
  );
}

// ── Icons (inline SVG, no external library) ──────────────────

export function IconDashboard() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

export function IconBuilding() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21h18" />
      <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
      <path d="M15 9h4a2 2 0 0 1 2 2v10" />
      <path d="M9 7h2" />
      <path d="M9 11h2" />
      <path d="M9 15h2" />
    </svg>
  );
}

export function IconUser() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

export function IconLogout() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function IconPlus() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconClock() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export function IconMapPin() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function IconFolder() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9L9.2 3.9A2 2 0 0 0 7.5 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

export function IconBriefcase() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

export function IconChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function IconStop() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export function IconUsers() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="8" r="4" />
      <path d="M1 21c0-4 3.6-6 8-6s8 2 8 6" />
      <path d="M16 3.5a4 4 0 0 1 0 7.5" />
      <path d="M19 15.5c2.4.8 4 2.4 4 5.5" />
    </svg>
  );
}
