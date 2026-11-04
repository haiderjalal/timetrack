import { describe, expect, it } from "vitest";

import { formatCalendarDate, formatTimeValue } from "./formatDate";
import { getGreeting } from "./greeting";
import { getWeekdayName, getWeekdays } from "./weekdays";
import { getZonedNow, isValidTimeZone } from "./zonedNow";

describe("getZonedNow", () => {
  // 2026-11-02 21:30 UTC is already Tuesday morning in Karachi (UTC+5).
  const instant = new Date("2026-11-02T21:30:00Z");

  it("reads the date, weekday and time in the org timezone", () => {
    expect(getZonedNow("Asia/Karachi", instant)).toEqual({
      isoDate: "2026-11-03",
      weekday: 2,
      hour: 2,
      minute: 30,
      second: 0,
    });
  });

  it("can still be the previous day elsewhere", () => {
    expect(getZonedNow("America/New_York", instant)).toEqual({
      isoDate: "2026-11-02",
      weekday: 1,
      hour: 16,
      minute: 30,
      second: 0,
    });
  });

  it("reports midnight as hour 0", () => {
    expect(getZonedNow("UTC", new Date("2026-11-03T00:05:00Z")).hour).toBe(0);
  });
});

describe("isValidTimeZone", () => {
  it.each(["Asia/Karachi", "Europe/London", "UTC", "Asia/Calcutta"])(
    "accepts %s",
    (zone) => {
      expect(isValidTimeZone(zone)).toBe(true);
    },
  );

  it.each(["", "Mars/Olympus", "GMT+25"])("rejects %j", (zone) => {
    expect(isValidTimeZone(zone)).toBe(false);
  });
});

describe("formatTimeValue", () => {
  it("drops the seconds Postgres adds", () => {
    expect(formatTimeValue("09:00:00")).toBe("09:00");
    expect(formatTimeValue("18:30")).toBe("18:30");
  });
});

describe("formatCalendarDate", () => {
  it("formats a calendar day without shifting it across timezones", () => {
    expect(formatCalendarDate("2026-11-03")).toBe("Tue, 3 Nov");
  });
});

describe("getGreeting", () => {
  it.each([
    [0, "Good morning"],
    [11, "Good morning"],
    [12, "Good afternoon"],
    [16, "Good afternoon"],
    [17, "Good evening"],
    [23, "Good evening"],
  ])("at %d:00 says %s", (hour, expected) => {
    expect(getGreeting(hour)).toBe(expected);
  });
});

describe("getWeekdays", () => {
  it("starts on Monday by default", () => {
    expect(getWeekdays().map((day) => day.shortName)).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ]);
  });

  it("can start on Sunday", () => {
    expect(getWeekdays(0).map((day) => day.value)).toEqual([
      0, 1, 2, 3, 4, 5, 6,
    ]);
  });

  it("names a weekday", () => {
    expect(getWeekdayName(2)).toBe("Tuesday");
  });
});
