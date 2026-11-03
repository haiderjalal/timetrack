/** One weekday's rule in a working-hours version. */
export interface ScheduleDay {
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  isWorkingDay: boolean;
  /** `HH:MM`, null on a day off. */
  startTime: string | null;
  /** `HH:MM`; earlier than startTime means the shift ends the next day. */
  endTime: string | null;
  requiredMinutes: number;
}

/** The working-hours version in effect on a given date (business-rules.md §8). */
export interface WorkSchedule {
  effectiveFrom: string;
  graceMinutes: number;
  /** All seven days, Sunday first. */
  days: ScheduleDay[];
}
