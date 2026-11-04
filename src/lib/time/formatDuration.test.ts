import { describe, expect, it } from "vitest";

import {
  describeDuration,
  formatClockTime,
  formatDuration,
  formatSignedDuration,
} from "./formatDuration";

describe("formatDuration", () => {
  it.each([
    [0, "0m"],
    [45, "45m"],
    [60, "1h"],
    [480, "8h"],
    [425, "7h 05m"],
    [505, "8h 25m"],
    [59.6, "1h"],
  ])("formats %s minutes as %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });

  it("never shows a negative duration", () => {
    expect(formatDuration(-10)).toBe("0m");
  });
});

describe("formatSignedDuration", () => {
  it("marks overtime and shortfall", () => {
    expect(formatSignedDuration(25)).toBe("+25m");
    expect(formatSignedDuration(-70)).toBe("−1h 10m");
    expect(formatSignedDuration(0)).toBe("0m");
  });
});

describe("describeDuration", () => {
  it("spells durations out for screen readers", () => {
    expect(describeDuration(425)).toBe("7 hours 5 minutes");
    expect(describeDuration(60)).toBe("1 hour");
    expect(describeDuration(1)).toBe("1 minute");
    expect(describeDuration(0)).toBe("0 minutes");
  });
});

describe("formatClockTime", () => {
  it("formats a minute of the day as 24-hour time", () => {
    expect(formatClockTime(0)).toBe("00:00");
    expect(formatClockTime(9 * 60 + 5)).toBe("09:05");
    expect(formatClockTime(23 * 60 + 59)).toBe("23:59");
    expect(formatClockTime(24 * 60 + 30)).toBe("00:30");
  });
});
