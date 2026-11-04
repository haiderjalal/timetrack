import { z } from "zod";

// Mirror the database checks on work_schedules / work_schedule_days.
export const MAX_GRACE_MINUTES = 120;
export const MAX_REQUIRED_HOURS = 24;

// <input type="time"> gives "09:00", or "09:00:00" when seconds are shown.
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const WEEKDAY_COUNT = 7;

/** Parses an "hours required" field ("8", "7.5"). Null if it isn't 0–24. */
export function parseRequiredHours(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const hours = Number(trimmed);
  return Number.isFinite(hours) && hours >= 0 && hours <= MAX_REQUIRED_HOURS
    ? hours
    : null;
}

/** Parses the grace period field. Null if it isn't a whole number 0–120. */
export function parseGraceMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const minutes = Number(trimmed);
  return minutes <= MAX_GRACE_MINUTES ? minutes : null;
}

/**
 * One weekday in the working-hours editor. Numbers stay strings, as the inputs
 * give them, so an empty field is an error instead of a silent 0. Times and
 * hours only matter on working days: a day off keeps them for when it's
 * switched back on.
 */
export const scheduleDaySchema = z
  .object({
    weekday: z.int().min(0).max(6),
    isWorkingDay: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
    requiredHours: z.string(),
  })
  .superRefine((day, context) => {
    if (!day.isWorkingDay) return;

    if (!TIME_PATTERN.test(day.startTime)) {
      context.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Enter a start time.",
      });
    }
    if (!TIME_PATTERN.test(day.endTime)) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "Enter an end time.",
      });
    }
    if (parseRequiredHours(day.requiredHours) === null) {
      context.addIssue({
        code: "custom",
        path: ["requiredHours"],
        message: `Enter 0 to ${MAX_REQUIRED_HOURS} hours.`,
      });
    }
  });

export const scheduleSchema = z.object({
  graceMinutes: z
    .string()
    .refine((value) => parseGraceMinutes(value) !== null, {
      message: `Enter 0 to ${MAX_GRACE_MINUTES} minutes.`,
    }),
  days: z
    .array(scheduleDaySchema)
    .length(WEEKDAY_COUNT)
    .refine(
      (days) => new Set(days.map((day) => day.weekday)).size === WEEKDAY_COUNT,
      { message: "Set the hours for each day of the week once." },
    ),
});

export type ScheduleDayInput = z.infer<typeof scheduleDaySchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
