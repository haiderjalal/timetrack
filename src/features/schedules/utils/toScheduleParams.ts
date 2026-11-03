import {
  parseGraceMinutes,
  parseRequiredHours,
} from "@/lib/validations/schedule.schema";

import type { ScheduleInput } from "@/lib/validations/schedule.schema";

const MINUTES_PER_HOUR = 60;

/**
 * The `p_schedule` shape the database functions expect (docs/database.md §6).
 * A type alias, not an interface, so it is assignable to the RPC's Json type.
 */
export type ScheduleParams = {
  grace_minutes: number;
  days: {
    weekday: number;
    is_working_day: boolean;
    start_time: string | null;
    end_time: string | null;
    required_minutes: number;
  }[];
};

/**
 * Converts validated form values to database values: hours become whole
 * minutes, and a day off stores no times and 0 required minutes.
 */
export function toScheduleParams(schedule: ScheduleInput): ScheduleParams {
  return {
    grace_minutes: parseGraceMinutes(schedule.graceMinutes) ?? 0,
    days: schedule.days.map((day) =>
      day.isWorkingDay
        ? {
            weekday: day.weekday,
            is_working_day: true,
            start_time: day.startTime,
            end_time: day.endTime,
            required_minutes: Math.round(
              (parseRequiredHours(day.requiredHours) ?? 0) * MINUTES_PER_HOUR,
            ),
          }
        : {
            weekday: day.weekday,
            is_working_day: false,
            start_time: null,
            end_time: null,
            required_minutes: 0,
          },
    ),
  };
}
