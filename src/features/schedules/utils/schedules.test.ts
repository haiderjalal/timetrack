import { describe, expect, it } from "vitest";

import { getDefaultSchedule } from "../constants/defaultSchedule";
import { formatShiftRange, getLateAfter, getScheduledDay } from "./shift";
import { toScheduleParams } from "./toScheduleParams";

import type { ScheduleDay } from "../types/schedule";

describe("getDefaultSchedule", () => {
  it("pre-fills the confirmed defaults: Mon–Fri 09:00–18:00, 8h, 15 min grace", () => {
    const schedule = getDefaultSchedule();

    expect(schedule.graceMinutes).toBe("15");
    expect(schedule.days.map((day) => [day.weekday, day.isWorkingDay])).toEqual(
      [
        [1, true],
        [2, true],
        [3, true],
        [4, true],
        [5, true],
        [6, false],
        [0, false],
      ],
    );
    expect(
      schedule.days.every(
        (day) =>
          day.startTime === "09:00" &&
          day.endTime === "18:00" &&
          day.requiredHours === "8",
      ),
    ).toBe(true);
  });

  it("follows the org's first day of the week", () => {
    expect(getDefaultSchedule(0).days[0]?.weekday).toBe(0);
  });
});

describe("toScheduleParams", () => {
  it("turns hours into minutes and clears days off", () => {
    const schedule = getDefaultSchedule();
    const monday = schedule.days[0];
    if (!monday) throw new Error("expected seven days");
    monday.requiredHours = "7.75";

    const params = toScheduleParams(schedule);

    expect(params.grace_minutes).toBe(15);
    expect(params.days[0]).toEqual({
      weekday: 1,
      is_working_day: true,
      start_time: "09:00",
      end_time: "18:00",
      required_minutes: 465,
    });
    expect(params.days[5]).toEqual({
      weekday: 6,
      is_working_day: false,
      start_time: null,
      end_time: null,
      required_minutes: 0,
    });
  });
});

function day(overrides: Partial<ScheduleDay> = {}): ScheduleDay {
  return {
    weekday: 1,
    isWorkingDay: true,
    startTime: "09:00",
    endTime: "18:00",
    requiredMinutes: 480,
    ...overrides,
  };
}

describe("formatShiftRange", () => {
  it("shows the shift", () => {
    expect(formatShiftRange(day())).toBe("09:00 – 18:00");
  });

  it("marks a shift that ends after midnight", () => {
    expect(
      formatShiftRange(day({ startTime: "22:00", endTime: "06:00" })),
    ).toBe("22:00 – 06:00 next day");
  });

  it("has nothing to show on a day off", () => {
    expect(
      formatShiftRange(
        day({ isWorkingDay: false, startTime: null, endTime: null }),
      ),
    ).toBeNull();
  });
});

describe("getScheduledDay", () => {
  const versions = [
    {
      effectiveFrom: "2026-11-01",
      graceMinutes: 15,
      days: [day({ weekday: 1 })],
    },
    {
      effectiveFrom: "2026-12-01",
      graceMinutes: 5,
      days: [day({ weekday: 1, startTime: "08:00" })],
    },
  ];

  it("uses the newest version that started on or before the date", () => {
    expect(getScheduledDay(versions, "2026-11-30", 1)).toEqual({
      day: day({ weekday: 1 }),
      graceMinutes: 15,
    });
    expect(getScheduledDay(versions, "2026-12-07", 1)?.day.startTime).toBe(
      "08:00",
    );
  });

  it("has no rule before the first version", () => {
    expect(getScheduledDay(versions, "2026-10-26", 1)).toBeNull();
  });
});

describe("getLateAfter", () => {
  it("adds the grace period to the start time", () => {
    expect(getLateAfter("09:00", 15)).toBe("09:15");
    expect(getLateAfter("23:50", 15)).toBe("00:05");
  });
});
