import { describe, expect, it } from "vitest";

import { clockOutSchema } from "@/lib/validations/clock.schema";

import {
  formatTimer,
  getRingValue,
  secondsSince,
  sumClosedSeconds,
} from "./clockDisplay";
import { describeClockFailure, toClockFailure } from "./clockErrors";

describe("clock display", () => {
  it("shows a running session as a stopwatch", () => {
    expect(formatTimer(0)).toBe("00:00:00");
    expect(formatTimer(3 * 3600 + 12 * 60 + 45)).toBe("03:12:45");
    expect(formatTimer(-5)).toBe("00:00:00");
  });

  it("measures whole seconds and never goes negative", () => {
    const start = "2026-11-03T04:00:00.000Z";
    expect(secondsSince(start, Date.parse("2026-11-03T04:01:30.900Z"))).toBe(
      90,
    );
    expect(secondsSince(start, Date.parse("2026-11-03T03:59:00Z"))).toBe(0);
  });

  it("adds up closed sessions only", () => {
    expect(
      sumClosedSeconds([
        {
          clockInAt: "2026-11-03T04:00:00Z",
          clockOutAt: "2026-11-03T08:00:00Z",
        },
        { clockInAt: "2026-11-03T09:00:00Z", clockOutAt: null },
      ]),
    ).toBe(4 * 3600);
  });

  it("maps worked time onto the ring, with one lap of overtime at most", () => {
    expect(getRingValue(240, 480)).toBe(50);
    expect(getRingValue(600, 480)).toBe(125);
    expect(getRingValue(2000, 480)).toBe(200);
    expect(getRingValue(60, 0)).toBe(0);
  });
});

describe("clock errors", () => {
  it("recognizes the database's refusals", () => {
    expect(toClockFailure("already_clocked_in")).toBe("already_clocked_in");
    expect(toClockFailure("relation does not exist")).toBe("unknown");
    expect(toClockFailure(undefined)).toBe("unknown");
  });

  it("explains them in plain words, never the database's", () => {
    expect(describeClockFailure("already_clocked_in", "clock_in").message).toBe(
      "You're already clocked in.",
    );
    expect(describeClockFailure("unknown", "clock_out").message).toBe(
      "Couldn't clock you out. Check your connection and try again.",
    );
    expect(describeClockFailure("invalid_input", "clock_out").errors).toEqual([
      { field: "note", message: "Keep the note to 500 characters." },
    ]);
  });
});

describe("clockOutSchema", () => {
  it("trims the note and allows none", () => {
    expect(
      clockOutSchema.parse({ orgSlug: "acme", note: "  Left early  " }),
    ).toEqual({ orgSlug: "acme", note: "Left early" });
    expect(clockOutSchema.parse({ orgSlug: "acme" })).toEqual({
      orgSlug: "acme",
    });
  });

  it("refuses notes over 500 characters", () => {
    const result = clockOutSchema.safeParse({
      orgSlug: "acme",
      note: "x".repeat(501),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Keep the note to 500 characters.",
    );
  });
});
