/** A Postgres `time` (`"09:00:00"`) or `"09:00"` as `"09:00"`. */
export function formatTimeValue(time: string): string {
  return time.slice(0, 5);
}

/** `"2026-11-03"` → `"Tue, 3 Nov"`. The date is a calendar day, not an instant. */
export function formatCalendarDate(isoDate: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(new Date(`${isoDate}T00:00:00Z`));
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("weekday")}, ${part("day")} ${part("month")}`;
}
