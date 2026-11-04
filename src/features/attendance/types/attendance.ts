/**
 * Day status, first matching rule wins (docs/business-rules.md §4). `holiday`
 * and `on_leave` join with holidays (Phase 4) and leave (Phase 5).
 */
export type DayStatus =
  "upcoming" | "day_off" | "in_progress" | "absent" | "complete" | "short";

export interface SessionTimes {
  clockInAt: string;
  /** Null while the session is running. */
  clockOutAt: string | null;
  autoClosed: boolean;
}

export interface DaySummary {
  isoDate: string;
  status: DayStatus;
  isWorkingDay: boolean;
  requiredMinutes: number;
  /** Closed sessions, plus a running one up to now (shown live, not final). */
  workedMinutes: number;
  overtimeMinutes: number;
  /** Only once a working day is over; 0 while it is in progress. */
  shortfallMinutes: number;
  isLate: boolean;
  sessionCount: number;
  hasOpenSession: boolean;
  autoClosedSessions: number;
}

export interface PeriodSummary {
  workedMinutes: number;
  requiredMinutes: number;
  overtimeMinutes: number;
  shortfallMinutes: number;
  /** Scheduled working days so far (upcoming days aren't counted). */
  workingDays: number;
  /** `complete` + `short` days. */
  presentDays: number;
  shortDays: number;
  absentDays: number;
  lateDays: number;
  autoClosedSessions: number;
}
