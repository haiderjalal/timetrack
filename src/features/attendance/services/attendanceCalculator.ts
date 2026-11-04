import {
  crossesMidnight,
  toMinuteOfDay,
} from "@/features/schedules/utils/shift";
import { daysBetween } from "@/lib/time/calendarDate";
import { getZonedNow } from "@/lib/time/zonedNow";

import type {
  DayStatus,
  DaySummary,
  PeriodSummary,
  SessionTimes,
} from "../types/attendance";
import type { ScheduledDay } from "@/features/schedules/utils/shift";

// The daily calculation of docs/business-rules.md §4, as plain functions so
// every rule is unit-tested. Pages pass in what the database returned; nothing
// here reads the clock or the network.

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_DAY = 24 * 60 * SECONDS_PER_MINUTE;
const MINUTES_PER_DAY = 24 * 60;

export interface DayInput {
  isoDate: string;
  /** The rule in effect on that date; null before the org's first hours (a day off). */
  scheduled: ScheduledDay | null;
  /** Sessions whose work date is `isoDate`. */
  sessions: readonly SessionTimes[];
}

export interface CalculationContext {
  timeZone: string;
  now: Date;
}

export function summarizeDay(
  input: DayInput,
  context: CalculationContext,
): DaySummary {
  const day = input.scheduled?.day ?? null;
  const startTime = day?.isWorkingDay ? day.startTime : null;
  const endTime = day?.isWorkingDay ? day.endTime : null;
  const isWorkingDay = Boolean(startTime && endTime);
  const requiredMinutes = isWorkingDay && day ? day.requiredMinutes : 0;

  const workedMinutes = Math.floor(
    sumWorkedSeconds(input.sessions, context.now.getTime()) /
      SECONDS_PER_MINUTE,
  );
  const hasOpenSession = input.sessions.some(
    (session) => session.clockOutAt === null,
  );
  const shiftRunning =
    startTime && endTime
      ? secondsSinceMidnight(context.now, input.isoDate, context.timeZone) <
        shiftEndSeconds(startTime, endTime)
      : false;

  const status = getDayStatus({
    isoDate: input.isoDate,
    today: getZonedNow(context.timeZone, context.now).isoDate,
    isWorkingDay,
    isRunning: hasOpenSession || shiftRunning,
    workedMinutes,
    requiredMinutes,
  });
  const isFinal = status !== "upcoming" && status !== "in_progress";

  return {
    isoDate: input.isoDate,
    status,
    isWorkingDay,
    requiredMinutes,
    workedMinutes,
    overtimeMinutes:
      status === "upcoming" ? 0 : Math.max(0, workedMinutes - requiredMinutes),
    shortfallMinutes:
      isFinal && requiredMinutes > 0
        ? Math.max(0, requiredMinutes - workedMinutes)
        : 0,
    isLate:
      startTime !== null && isLateArrival(input, startTime, context.timeZone),
    sessionCount: input.sessions.length,
    hasOpenSession,
    autoClosedSessions: input.sessions.filter((session) => session.autoClosed)
      .length,
  };
}

/** Totals for a period, leaving out days that haven't happened yet. */
export function summarizePeriod(days: readonly DaySummary[]): PeriodSummary {
  const counted = days.filter((day) => day.status !== "upcoming");
  const count = (predicate: (day: DaySummary) => boolean): number =>
    counted.filter(predicate).length;
  const sum = (pick: (day: DaySummary) => number): number =>
    counted.reduce((total, day) => total + pick(day), 0);

  return {
    workedMinutes: sum((day) => day.workedMinutes),
    requiredMinutes: sum((day) => day.requiredMinutes),
    overtimeMinutes: sum((day) => day.overtimeMinutes),
    shortfallMinutes: sum((day) => day.shortfallMinutes),
    workingDays: count((day) => day.isWorkingDay),
    presentDays: count(
      (day) => day.status === "complete" || day.status === "short",
    ),
    shortDays: count((day) => day.status === "short"),
    absentDays: count((day) => day.status === "absent"),
    lateDays: count((day) => day.isLate),
    autoClosedSessions: sum((day) => day.autoClosedSessions),
  };
}

interface StatusFacts {
  isoDate: string;
  today: string;
  isWorkingDay: boolean;
  /** A session is open, or the shift hasn't ended yet. */
  isRunning: boolean;
  workedMinutes: number;
  requiredMinutes: number;
}

function getDayStatus(facts: StatusFacts): DayStatus {
  if (facts.isoDate > facts.today) return "upcoming";
  if (!facts.isWorkingDay) return "day_off";
  if (facts.isRunning) return "in_progress";
  if (facts.workedMinutes === 0) return "absent";
  return facts.workedMinutes >= facts.requiredMinutes ? "complete" : "short";
}

function sumWorkedSeconds(
  sessions: readonly SessionTimes[],
  nowMs: number,
): number {
  return sessions.reduce((total, session) => {
    const start = Date.parse(session.clockInAt);
    const end = session.clockOutAt ? Date.parse(session.clockOutAt) : nowMs;
    return total + Math.max(0, Math.floor((end - start) / 1000));
  }, 0);
}

/** An instant as seconds since midnight of `isoDate` in the org's timezone. */
function secondsSinceMidnight(
  instant: Date,
  isoDate: string,
  timeZone: string,
): number {
  const local = getZonedNow(timeZone, instant);
  return (
    daysBetween(isoDate, local.isoDate) * SECONDS_PER_DAY +
    (local.hour * 60 + local.minute) * SECONDS_PER_MINUTE +
    local.second
  );
}

function shiftEndSeconds(startTime: string, endTime: string): number {
  const nextDay = crossesMidnight(startTime, endTime) ? MINUTES_PER_DAY : 0;
  return (toMinuteOfDay(endTime) + nextDay) * SECONDS_PER_MINUTE;
}

/** First clock-in later than start time + grace (business-rules.md §4). */
function isLateArrival(
  input: DayInput,
  startTime: string,
  timeZone: string,
): boolean {
  const firstClockIn = input.sessions.reduce<string | null>(
    (first, session) =>
      first === null || session.clockInAt < first ? session.clockInAt : first,
    null,
  );
  if (!firstClockIn) return false;

  const graceMinutes = input.scheduled?.graceMinutes ?? 0;
  const lateAfter =
    (toMinuteOfDay(startTime) + graceMinutes) * SECONDS_PER_MINUTE;
  return (
    secondsSinceMidnight(new Date(firstClockIn), input.isoDate, timeZone) >
    lateAfter
  );
}
