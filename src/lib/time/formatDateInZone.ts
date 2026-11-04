/** `"2026-11-03T20:30:00Z"` in Asia/Karachi → `"4 Nov 2026"`: dates follow the org's timezone. */
export function formatDateInZone(instant: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(instant));
}
