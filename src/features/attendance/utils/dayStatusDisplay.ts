import type { DayStatus, DaySummary } from "../types/attendance";
import type { StatusTone } from "@/components/shared/StatusBadge";

/** Every status has a word next to its color (docs/design-system.md §7). */
export const DAY_STATUS_DISPLAY: Record<
  DayStatus,
  { label: string; tone: StatusTone }
> = {
  upcoming: { label: "Upcoming", tone: "off" },
  day_off: { label: "Day off", tone: "off" },
  in_progress: { label: "In progress", tone: "present" },
  absent: { label: "Absent", tone: "absent" },
  complete: { label: "Complete", tone: "present" },
  short: { label: "Short", tone: "short" },
};

/** The one-word badge for a day, with time off worked shown as overtime. */
export function getDayBadge(day: DaySummary): {
  label: string;
  tone: StatusTone;
} {
  if (day.status === "day_off" && day.workedMinutes > 0) {
    return { label: "Overtime", tone: "overtime" };
  }
  if (day.status === "complete" && day.overtimeMinutes > 0) {
    return { label: "Overtime", tone: "overtime" };
  }
  return DAY_STATUS_DISPLAY[day.status];
}
