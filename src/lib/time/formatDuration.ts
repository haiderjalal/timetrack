const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;
const MINUS_SIGN = "−";

/**
 * Durations as shown everywhere in the product (docs/design-system.md §2.3):
 * `45m`, `8h`, `7h 05m`. Minutes are zero-padded once there are hours, so
 * columns of durations line up.
 */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${String(rest).padStart(2, "0")}m`;
}

/** Overtime and shortfall: `+25m`, `−1h 10m`, `0m`. */
export function formatSignedDuration(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes);
  if (rounded === 0) return "0m";
  const sign = rounded > 0 ? "+" : MINUS_SIGN;
  return `${sign}${formatDuration(Math.abs(rounded))}`;
}

/** Screen-reader wording for a duration: "7 hours 5 minutes". */
export function describeDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  if (rest > 0 || hours === 0) {
    parts.push(`${rest} ${rest === 1 ? "minute" : "minutes"}`);
  }
  return parts.join(" ");
}

/** A minute of the day (0–1439) as a 24-hour clock time: `09:05`. */
export function formatClockTime(minuteOfDay: number): string {
  const minutes =
    ((Math.round(minuteOfDay) % MINUTES_PER_DAY) + MINUTES_PER_DAY) %
    MINUTES_PER_DAY;
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
