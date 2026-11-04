// Calendar dates (`YYYY-MM-DD`) and months (`YYYY-MM`) as plain values. They
// are days on a wall calendar, not instants, so the math runs in UTC where no
// day is ever 23 or 25 hours long.

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

function toUtcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  return toIsoDate(new Date(toUtcDate(isoDate).getTime() + days * MS_PER_DAY));
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (toUtcDate(to).getTime() - toUtcDate(from).getTime()) / MS_PER_DAY,
  );
}

/** 0 = Sunday … 6 = Saturday, matching work_schedule_days.weekday. */
export function getWeekdayOf(isoDate: string): number {
  return toUtcDate(isoDate).getUTCDay();
}

/** The first day of the week containing `isoDate`, for an org's first weekday. */
export function startOfWeek(isoDate: string, weekStartsOn: number): string {
  const back = (getWeekdayOf(isoDate) - weekStartsOn + 7) % 7;
  return addDays(isoDate, -back);
}

/** Every date from `from` to `to`, both included. */
export function listDates(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

export function isIsoMonth(value: string): boolean {
  return MONTH_PATTERN.test(value);
}

/** `"2026-11-03"` → `"2026-11"`. */
export function getMonthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function addMonths(isoMonth: string, months: number): string {
  const [year = 0, month = 1] = isoMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  return toIsoDate(date).slice(0, 7);
}

export function getFirstDayOfMonth(isoMonth: string): string {
  return `${isoMonth}-01`;
}

export function getLastDayOfMonth(isoMonth: string): string {
  return addDays(getFirstDayOfMonth(addMonths(isoMonth, 1)), -1);
}

/** `"2026-11"` → `"November 2026"`. */
export function formatMonth(isoMonth: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(toUtcDate(getFirstDayOfMonth(isoMonth)));
}
