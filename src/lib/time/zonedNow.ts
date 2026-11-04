/** The current moment as wall-clock values in one IANA timezone. */
export interface ZonedNow {
  /** Calendar date in that zone, `YYYY-MM-DD`. */
  isoDate: string;
  /** 0 = Sunday … 6 = Saturday, matching work_schedule_days.weekday. */
  weekday: number;
  hour: number;
  minute: number;
  second: number;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * What the clock says at an instant (default: now) for an org. Dates and schedules always use the
 * org timezone, never the server's or the device's (business-rules.md §2).
 */
export function getZonedNow(
  timeZone: string,
  now: Date = new Date(),
): ZonedNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((item) => item.type === type)?.value ?? "";

  return {
    isoDate: `${part("year")}-${part("month")}-${part("day")}`,
    weekday: WEEKDAY_INDEX[part("weekday")] ?? 0,
    hour: Number(part("hour")),
    minute: Number(part("minute")),
    second: Number(part("second")),
  };
}

/** True for any zone the runtime knows, including aliases like Asia/Calcutta. */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}
