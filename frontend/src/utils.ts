// ============================================================
// Workis - Utility helpers
// ============================================================

/**
 * Sanitize a value into a finite non-negative number of seconds.
 * Returns 0 when the value is invalid (NaN, null, undefined, negative).
 */
function safeSeconds(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return num;
}

/**
 * Format a duration (in seconds) as "Xh Ym" or "Ym Zs".
 * Never returns NaN - invalid input yields "0s".
 */
export function formatDuration(totalSeconds: number): string {
  const total = safeSeconds(totalSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Format a human-friendly duration in the requested compact form:
 * "45m", "1h 05m", "7h 32m". Never returns NaN.
 */
export function formatDurationHuman(totalSeconds: number): string {
  const total = safeSeconds(totalSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `0m`;
}

/**
 * Parse an ISO instant (e.g. "2026-08-19T10:30:00Z") into a Date.
 * Java serializes Instant as an ISO-8601 string which new Date() can parse.
 * Returns null for invalid/null inputs.
 */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a duration as "HH:MM:SS" for the timer display.
 * Never returns NaN - invalid input yields "00:00:00".
 */
export function formatTimer(totalSeconds: number): string {
  const total = safeSeconds(totalSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format an ISO date string (e.g. "2026-08-19") as a readable date.
 * Never returns "Invalid Date".
 */
export function formatDate(isoDate: string | null): string {
  const d = parseDate(isoDate);
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format an ISO instant (e.g. "2026-08-19T10:30:00Z") as a readable time.
 * Never returns "Invalid Date".
 */
export function formatTime(isoInstant: string | null): string {
  const d = parseDate(isoInstant);
  if (!d) return "—";
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format an ISO instant as a readable date + time.
 * Never returns "Invalid Date".
 */
export function formatDateTime(isoInstant: string | null): string {
  const d = parseDate(isoInstant);
  if (!d) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get the initials of a user's name, e.g. "Karolis" -> "K".
 */
export function getInitials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

/**
 * Parse an ISO-8601 duration string (e.g. "PT1H30M", "PT90.5S", "P1DT2H",
 * "-PT5M") into total seconds. Returns 0 for invalid input.
 */
function parseIsoDuration(value: string): number {
  const match =
    /^(-)?P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?)?$/.exec(
      value.trim()
    );
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const days = safeSeconds(match[2]);
  const hours = safeSeconds(match[3]);
  const minutes = safeSeconds(match[4]);
  const seconds = safeSeconds(match[5]);
  return sign * (days * 86_400 + hours * 3600 + minutes * 60 + seconds);
}

/**
 * A Java Duration can be serialized by Jackson in several ways:
 * - as a plain number (total seconds)
 * - as an object { seconds, nano }
 * - as an ISO-8601 string like "PT1H30M" (Spring Boot's default)
 * This helper accepts all three and always returns a finite number of seconds
 * (0 for null/undefined/invalid input) so the UI never shows NaN or 0s
 * for a real duration.
 */
export function durationToSeconds(
  duration: { seconds: number; nano: number } | number | string | null
): number {
  if (!duration) return 0;
  if (typeof duration === "number") return safeSeconds(duration);
  if (typeof duration === "string") return parseIsoDuration(duration);
  const seconds = safeSeconds(duration.seconds);
  const nano = safeSeconds(duration.nano);
  return seconds + nano / 1_000_000_000;
}

/**
 * Compute the elapsed seconds between an ISO start time and now.
 * Returns 0 when the start time cannot be parsed.
 */
export function elapsedSecondsFrom(isoInstant: string | null): number {
  const start = parseDate(isoInstant);
  if (!start) return 0;
  const diff = (Date.now() - start.getTime()) / 1000;
  return diff > 0 ? Math.floor(diff) : 0;
}

/**
 * Map a Date to a local "YYYY-MM-DD" key, using the user's local timezone.
 * Used to group/select time entries by calendar day.
 */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Format a date key (e.g. "2026-08-25") as "August 25".
 */
export function formatMonthDay(isoDate: string | null): string {
  const d = parseDate(isoDate);
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

/**
 * Convert a Date into the value format used by <input type="datetime-local">:
 * "YYYY-MM-DDTHH:mm" in local time. Returns "" for invalid/null inputs.
 */
export function toLocalDateTimeValue(date: Date | null | undefined): string {
  if (!date || isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

/**
 * Convert a <input type="datetime-local"> value ("YYYY-MM-DDTHH:mm", local
 * time) into an ISO instant string. Returns null when the input is empty/invalid.
 */
export function fromLocalDateTimeValue(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

// ── Lithuanian public (non-working) holidays ─────────────────

/**
 * Compute Easter Sunday for a given year using the
 * Meeus/Jones/Butcher ("Anonymous Gregorian") algorithm.
 * Only used by the offline fallback list below.
 */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Offline fallback: date keys ("YYYY-MM-DD") of Lithuanian public
 * holidays for the given year (fixed dates + movable Easter).
 * Used only when the holidays API cannot be reached.
 */
function fallbackLithuanianHolidayDateKeys(year: number): Set<string> {
  const keys = new Set<string>();
  const add = (month: number, day: number) =>
    keys.add(toDateKey(new Date(year, month - 1, day)));

  add(1, 1); // New Year's Day
  add(2, 16); // Day of Restoration of the State of Lithuania
  add(3, 11); // Day of Restoration of Independence of Lithuania

  const easter = easterSunday(year); // Easter Sunday
  keys.add(toDateKey(easter));
  const easterMonday = new Date(easter);
  easterMonday.setDate(easterMonday.getDate() + 1);
  keys.add(toDateKey(easterMonday)); // Easter Monday

  add(5, 1); // Labour Day
  add(6, 24); // St. John's Day (Joninės)
  add(7, 6); // Statehood Day
  add(8, 15); // Assumption Day (Žolinė)
  add(11, 1); // All Saints' Day (Visų šventųjų diena)
  add(11, 2); // All Souls' Day (Vėlinės)
  add(12, 24); // Christmas Eve (Kūčios)
  add(12, 25); // Christmas Day
  add(12, 26); // Second Day of Christmas

  return keys;
}

const holidayCache = new Map<number, Promise<Set<string>>>();

/**
 * Date keys ("YYYY-MM-DD", local timezone) of Lithuanian public
 * (non-working) holidays for the given year, fetched from the free
 * Nager.Date API (https://date.nager.at — no API key required,
 * CORS-enabled). Results are cached per year for the session.
 *
 * Falls back to a built-in static list when the API is unreachable,
 * so weekend/holiday marking still works offline.
 */
export function fetchLithuanianHolidayDateKeys(
  year: number
): Promise<Set<string>> {
  const cached = holidayCache.get(year);
  if (cached) return cached;

  const promise = fetch(
    `https://date.nager.at/api/v3/PublicHolidays/${year}/LT`
  )
    .then((res) => {
      if (!res.ok) throw new Error(`Holidays API returned ${res.status}`);
      return res.json() as Promise<{ date: string }[]>;
    })
    .then((holidays) => {
      const keys = new Set(holidays.map((h) => h.date));
      if (keys.size === 0) throw new Error("Holidays API returned no data");
      return keys;
    })
    .catch(() => fallbackLithuanianHolidayDateKeys(year));

  holidayCache.set(year, promise);
  return promise;
}
