import { describe, expect, it } from "vitest";

import { summarizeDay, summarizePeriod } from "./attendanceCalculator";

import type { DayInput } from "./attendanceCalculator";
import type { SessionTimes } from "../types/attendance";
import type { ScheduledDay } from "@/features/schedules/utils/shift";

// The worked examples of docs/business-rules.md §4: Mon–Fri 09:00–18:00, 8h
// required, 15 min grace, org in Asia/Karachi (UTC+5, no daylight saving).
// Monday 2 November 2026 to Sunday 8 November.
const TIME_ZONE = "Asia/Karachi";

const WORKING: ScheduledDay = {
  day: {
    weekday: 1,
    isWorkingDay: true,
    startTime: "09:00",
    endTime: "18:00",
    requiredMinutes: 480,
  },
  graceMinutes: 15,
};

const DAY_OFF: ScheduledDay = {
  day: {
    weekday: 6,
    isWorkingDay: false,
    startTime: null,
    endTime: null,
    requiredMinutes: 0,
  },
  graceMinutes: 15,
};

const NIGHT_SHIFT: ScheduledDay = {
  day: { ...WORKING.day, startTime: "22:00", endTime: "06:00" },
  graceMinutes: 15,
};

/** A wall-clock time in Karachi as an ISO instant. */
function karachi(isoDate: string, time: string): string {
  return new Date(`${isoDate}T${time}+05:00`).toISOString();
}

function session(
  isoDate: string,
  start: string,
  end: string | null,
  autoClosed = false,
): SessionTimes {
  return {
    clockInAt: karachi(isoDate, start),
    clockOutAt: end ? karachi(isoDate, end) : null,
    autoClosed,
  };
}

function day(
  isoDate: string,
  scheduled: ScheduledDay | null,
  sessions: SessionTimes[] = [],
): DayInput {
  return { isoDate, scheduled, sessions };
}

/** Friday 6 November, midday. */
const FRIDAY_NOON = {
  timeZone: TIME_ZONE,
  now: new Date(karachi("2026-11-06", "12:00:00")),
};

describe("summarizeDay: the business-rules examples", () => {
  it("Mon: 8h 25m over two sessions is complete with 25m overtime, on time", () => {
    const summary = summarizeDay(
      day("2026-11-02", WORKING, [
        session("2026-11-02", "09:05", "13:00"),
        session("2026-11-02", "14:00", "18:30"),
      ]),
      FRIDAY_NOON,
    );

    expect(summary).toMatchObject({
      status: "complete",
      workedMinutes: 505,
      requiredMinutes: 480,
      overtimeMinutes: 25,
      shortfallMinutes: 0,
      isLate: false,
      sessionCount: 2,
    });
  });

  it("Tue: 7h 20m starting 09:40 is short by 40m, and late", () => {
    expect(
      summarizeDay(
        day("2026-11-03", WORKING, [session("2026-11-03", "09:40", "17:00")]),
        FRIDAY_NOON,
      ),
    ).toMatchObject({
      status: "short",
      workedMinutes: 440,
      overtimeMinutes: 0,
      shortfallMinutes: 40,
      isLate: true,
    });
  });

  it("Wed: no sessions on a working day is an absence with 8h shortfall", () => {
    expect(summarizeDay(day("2026-11-04", WORKING), FRIDAY_NOON)).toMatchObject(
      {
        status: "absent",
        workedMinutes: 0,
        shortfallMinutes: 480,
        isLate: false,
      },
    );
  });

  it("Sat: all 3h worked on a day off are overtime", () => {
    expect(
      summarizeDay(
        day("2026-11-07", DAY_OFF, [session("2026-11-07", "10:00", "13:00")]),
        { timeZone: TIME_ZONE, now: new Date(karachi("2026-11-08", "09:00")) },
      ),
    ).toMatchObject({
      status: "day_off",
      requiredMinutes: 0,
      workedMinutes: 180,
      overtimeMinutes: 180,
      shortfallMinutes: 0,
      isLate: false,
    });
  });
});

describe("summarizeDay: today and later", () => {
  it("counts a running session up to now and keeps the day open", () => {
    expect(
      summarizeDay(
        day("2026-11-06", WORKING, [session("2026-11-06", "09:00", null)]),
        FRIDAY_NOON,
      ),
    ).toMatchObject({
      status: "in_progress",
      workedMinutes: 180,
      shortfallMinutes: 0,
      hasOpenSession: true,
    });
  });

  it("is in progress before the shift ends, even with nothing worked yet", () => {
    expect(summarizeDay(day("2026-11-06", WORKING), FRIDAY_NOON).status).toBe(
      "in_progress",
    );
  });

  it("becomes final once the shift is over", () => {
    expect(
      summarizeDay(day("2026-11-06", WORKING), {
        timeZone: TIME_ZONE,
        now: new Date(karachi("2026-11-06", "18:00:00")),
      }).status,
    ).toBe("absent");
  });

  it("doesn't count days that haven't happened", () => {
    expect(summarizeDay(day("2026-11-09", WORKING), FRIDAY_NOON)).toMatchObject(
      { status: "upcoming", overtimeMinutes: 0, shortfallMinutes: 0 },
    );
  });

  it("treats a date before the org's first working hours as a day off", () => {
    expect(summarizeDay(day("2026-11-02", null), FRIDAY_NOON).status).toBe(
      "day_off",
    );
  });
});

describe("summarizeDay: lateness", () => {
  it("allows the grace period to the second", () => {
    const at = (time: string) =>
      summarizeDay(
        day("2026-11-02", WORKING, [session("2026-11-02", time, "18:00")]),
        FRIDAY_NOON,
      ).isLate;

    expect(at("09:15:00")).toBe(false);
    expect(at("09:15:01")).toBe(true);
  });

  it("uses the day's first clock-in", () => {
    expect(
      summarizeDay(
        day("2026-11-02", WORKING, [
          session("2026-11-02", "13:30", "18:00"),
          session("2026-11-02", "09:00", "12:30"),
        ]),
        FRIDAY_NOON,
      ).isLate,
    ).toBe(false);
  });
});

describe("summarizeDay: a night shift (22:00 – 06:00)", () => {
  it("stays in progress past midnight until the shift ends", () => {
    expect(
      summarizeDay(day("2026-11-02", NIGHT_SHIFT), {
        timeZone: TIME_ZONE,
        now: new Date(karachi("2026-11-03", "02:00")),
      }).status,
    ).toBe("in_progress");
  });

  it("is late after 22:15 and complete once the shift is done", () => {
    const summary = summarizeDay(
      {
        isoDate: "2026-11-02",
        scheduled: NIGHT_SHIFT,
        sessions: [
          {
            clockInAt: karachi("2026-11-02", "22:20"),
            clockOutAt: karachi("2026-11-03", "06:30"),
            autoClosed: false,
          },
        ],
      },
      FRIDAY_NOON,
    );

    expect(summary).toMatchObject({
      status: "complete",
      workedMinutes: 490,
      overtimeMinutes: 10,
      isLate: true,
    });
  });
});

describe("summarizePeriod", () => {
  it("adds up the week, leaving out days still to come", () => {
    const now = {
      timeZone: TIME_ZONE,
      now: new Date(karachi("2026-11-07", "20:00")),
    };
    const week = [
      day("2026-11-02", WORKING, [
        session("2026-11-02", "09:05", "13:00"),
        session("2026-11-02", "14:00", "18:30"),
      ]),
      day("2026-11-03", WORKING, [session("2026-11-03", "09:40", "17:00")]),
      day("2026-11-04", WORKING),
      day("2026-11-05", WORKING, [
        session("2026-11-05", "09:00", "09:00", true),
      ]),
      day("2026-11-07", DAY_OFF, [session("2026-11-07", "10:00", "13:00")]),
      day("2026-11-09", WORKING),
    ].map((input) => summarizeDay(input, now));

    expect(summarizePeriod(week)).toEqual({
      workedMinutes: 505 + 440 + 180,
      requiredMinutes: 4 * 480,
      overtimeMinutes: 25 + 180,
      shortfallMinutes: 40 + 480 + 480,
      workingDays: 4,
      presentDays: 2,
      shortDays: 1,
      absentDays: 2,
      lateDays: 1,
      autoClosedSessions: 1,
    });
  });
});
