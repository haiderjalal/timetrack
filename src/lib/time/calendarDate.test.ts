import { describe, expect, it } from "vitest";

import {
  addDays,
  addMonths,
  daysBetween,
  formatMonth,
  getLastDayOfMonth,
  getMonthOf,
  getWeekdayOf,
  isIsoMonth,
  listDates,
  startOfWeek,
} from "./calendarDate";

describe("calendar dates", () => {
  it("adds days across months and years", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("counts whole days, ignoring daylight saving", () => {
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
    expect(daysBetween("2026-11-04", "2026-11-03")).toBe(-1);
  });

  it("knows the weekday", () => {
    expect(getWeekdayOf("2026-11-03")).toBe(2);
  });

  it("finds the start of the week for the org's first weekday", () => {
    expect(startOfWeek("2026-11-03", 1)).toBe("2026-11-02");
    expect(startOfWeek("2026-11-03", 0)).toBe("2026-11-01");
    expect(startOfWeek("2026-11-02", 1)).toBe("2026-11-02");
  });

  it("lists every date in a range", () => {
    expect(listDates("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });
});

describe("calendar months", () => {
  it("validates YYYY-MM", () => {
    expect(isIsoMonth("2026-11")).toBe(true);
    expect(isIsoMonth("2026-13")).toBe(false);
    expect(isIsoMonth("2026-1")).toBe(false);
  });

  it("moves between months and years", () => {
    expect(getMonthOf("2026-11-03")).toBe("2026-11");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("knows the last day, leap years included", () => {
    expect(getLastDayOfMonth("2028-02")).toBe("2028-02-29");
    expect(getLastDayOfMonth("2026-11")).toBe("2026-11-30");
  });

  it("names the month", () => {
    expect(formatMonth("2026-11")).toBe("November 2026");
  });
});
