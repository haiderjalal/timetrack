import { getWeekdays } from "@/lib/time/weekdays";

import type { ScheduleInput } from "@/lib/validations/schedule.schema";

// Confirmed defaults for a new org (business-rules.md §8): Mon–Fri
// 09:00–18:00, 8h required, 15 min grace, Saturday and Sunday off.
const DEFAULT_WORKING_WEEKDAYS: readonly number[] = [1, 2, 3, 4, 5];
const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "18:00";
const DEFAULT_REQUIRED_HOURS = "8";
const DEFAULT_GRACE_MINUTES = "15";

/** Pre-fills the working-hours editor. Days off keep times for when they're switched on. */
export function getDefaultSchedule(weekStartsOn?: number): ScheduleInput {
  return {
    graceMinutes: DEFAULT_GRACE_MINUTES,
    days: getWeekdays(weekStartsOn).map((weekday) => ({
      weekday: weekday.value,
      isWorkingDay: DEFAULT_WORKING_WEEKDAYS.includes(weekday.value),
      startTime: DEFAULT_START_TIME,
      endTime: DEFAULT_END_TIME,
      requiredHours: DEFAULT_REQUIRED_HOURS,
    })),
  };
}
