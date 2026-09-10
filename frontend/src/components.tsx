// ============================================================
// Logis — Shared UI components
// ============================================================

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useI18n, languageToLocale } from "./i18n";
import type { ProjectStatus, UserResponse } from "./types";
import {
  fetchLithuanianHolidayDateKeys,
  formatDurationHuman,
  toDateKey,
} from "./utils";

// ── Loading ──────────────────────────────────────────────────

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="loading-state">
      <div className="spinner" />
      <span>{label ?? t("loading")}</span>
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
  { labelKey: string; className: string }
> = {
  PENDING: { labelKey: "projectStatusPending", className: "badge-warning" },
  ACTIVE: { labelKey: "projectStatusActive", className: "badge-success" },
  COMPLETED: { labelKey: "projectStatusCompleted", className: "badge-primary" },
  CANCELLED: { labelKey: "projectStatusCancelled", className: "badge-danger" },
  ON_HOLD: { labelKey: "projectStatusOnHold", className: "badge-muted" },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useI18n();
  const meta = STATUS_BADGE[status] ?? {
    labelKey: status,
    className: "badge-muted",
  };
  return (
    <span className={`badge ${meta.className}`}>{t(meta.labelKey as any)}</span>
  );
}

// ── Month calendar ───────────────────────────────────────────

// Weekday labels are resolved via t() in MonthCalendar — see below.

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
  const { t, language } = useI18n();
  const calendarCells = buildCalendarCells(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    languageToLocale(language),
    { month: "long", year: "numeric" }
  );

  const weekdays = [
    t("weekdayMon"),
    t("weekdayTue"),
    t("weekdayWed"),
    t("weekdayThu"),
    t("weekdayFri"),
    t("weekdaySat"),
    t("weekdaySun"),
  ];

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
          ← {t("calendarPrev")}
        </button>
        <div className="calendar-month">{monthLabel}</div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onNextMonth}
          type="button"
        >
          {t("calendarNext")} →
        </button>
      </div>

      <div className="calendar-grid" role="grid">
        {weekdays.map((day) => (
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
          <span className="legend-dot worked" /> {t("calendarLegendWorked")}
        </span>
        <span>
          <span className="legend-dot nonwork" />{" "}
          {t("calendarLegendWeekendHoliday")}
        </span>
        <span>
          <span className="legend-dot selected" /> {t("calendarLegendSelected")}
        </span>
      </div>

      {monthTotalSeconds !== undefined && (
        <div className="muted small" style={{ marginTop: 12 }}>
          {t("calendarWorkedThisMonth")} ·{" "}
          {formatDurationHuman(monthTotalSeconds, language)}
        </div>
      )}
    </>
  );
}

// ── Context menu (⋮ dropdown) ────────────────────────────────

export interface DropdownMenuItem {
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  disabled?: boolean;
  title?: string;
}

/**
 * A "⋮" trigger that opens a small fixed-position context menu
 * (like a desktop right-click). Fixed positioning is required so the
 * menu escapes scrollable containers (e.g. table cards with
 * `overflow: auto`) that would clip an absolutely-positioned dropdown.
 */
export function DropdownMenu({ items, disabled, title }: DropdownMenuProps) {
  const { t } = useI18n();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      // Ignore clicks inside the menu popup or on the trigger.
      const target = e.target as HTMLElement;
      if (target.closest(".dropdown-menu-popup")) return;
      if (triggerRef.current?.contains(target)) return;
      close();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    function onScroll() {
      close();
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, close]);

  function toggle() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      // Open below-left of the trigger, clamped to the viewport.
      const menuWidth = 190;
      const top = Math.min(rect.bottom + 4, window.innerHeight - 8);
      const left = Math.max(
        8,
        Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)
      );
      setPosition({ top, left });
    }
    setOpen((o) => !o);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="btn btn-secondary btn-sm dropdown-trigger"
        onClick={toggle}
        disabled={disabled}
        title={title ?? t("dropdownActionsDefault")}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <IconDots />
      </button>
      {open && (
        <div
          className="dropdown-menu-popup"
          role="menu"
          style={{ top: position.top, left: position.left }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={`dropdown-item${item.danger ? " danger" : ""}`}
              disabled={item.disabled}
              onClick={() => {
                close();
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
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
  const { t } = useI18n();
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <span className="muted small">{t("memberFilterLabel")}</span>
      <select
        className="form-input"
        style={{ width: "auto" }}
        value={value === "all" ? "all" : String(value)}
        onChange={(e) =>
          onChange(e.target.value === "all" ? "all" : Number(e.target.value))
        }
        disabled={disabled}
      >
        <option value="all">{t("memberFilterAll")}</option>
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

export function IconDots() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
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

export function IconTrash() {
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
      <path d="M3 6h18" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function IconSettings() {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
