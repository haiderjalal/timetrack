const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
/** ProgressRing draws 0–100 for required time and up to one more lap of overtime. */
const RING_MAX = 200;

/** Whole seconds from an ISO instant to `nowMs`, never negative. */
export function secondsSince(isoInstant: string, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - Date.parse(isoInstant)) / 1000));
}

/** Time in closed sessions, in whole seconds; running ones are left out. */
export function sumClosedSeconds(
  entries: readonly { clockInAt: string; clockOutAt: string | null }[],
): number {
  return entries.reduce(
    (total, entry) =>
      entry.clockOutAt
        ? total + secondsSince(entry.clockInAt, Date.parse(entry.clockOutAt))
        : total,
    0,
  );
}

/** A running session as a stopwatch: `03:12:45`. */
export function formatTimer(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const rest = seconds % SECONDS_PER_MINUTE;
  return [hours, minutes, rest]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

/** Worked against required as the ring's 0–200 value. */
export function getRingValue(
  workedMinutes: number,
  requiredMinutes: number,
): number {
  if (requiredMinutes <= 0) return 0;
  return Math.min(RING_MAX, (workedMinutes / requiredMinutes) * 100);
}
