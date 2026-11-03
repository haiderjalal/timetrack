import { describe, expect, it } from "vitest";

import {
  DEMO_REQUIRED_MINUTES,
  INITIAL_CLOCK_DEMO_STATE,
  clockDemoReducer,
  getOvertimeMinutes,
  getRemainingMinutes,
  getRingValue,
  getWorkedMinutes,
} from "./clockDemo";

import type { ClockDemoAction, ClockDemoState } from "./clockDemo";

function run(
  actions: ClockDemoAction[],
  state: ClockDemoState = INITIAL_CLOCK_DEMO_STATE,
): ClockDemoState {
  return actions.reduce(clockDemoReducer, state);
}

function ticks(count: number): ClockDemoAction[] {
  return Array.from({ length: count }, () => ({ type: "tick" }) as const);
}

describe("clock demo", () => {
  it("starts half an hour short of an 8h day, clocked out", () => {
    expect(getWorkedMinutes(INITIAL_CLOCK_DEMO_STATE)).toBe(450);
    expect(getRemainingMinutes(INITIAL_CLOCK_DEMO_STATE)).toBe(30);
    expect(INITIAL_CLOCK_DEMO_STATE.clockedInAt).toBeNull();
  });

  it("only moves time while clocked in", () => {
    expect(run(ticks(5))).toEqual(INITIAL_CLOCK_DEMO_STATE);

    const state = run([{ type: "clockIn" }, ...ticks(5)]);
    expect(getWorkedMinutes(state)).toBe(455);
  });

  it("announces clocking in", () => {
    const state = run([{ type: "clockIn" }]);
    expect(state.announcement).toBe("Clocked in at 17:17.");
  });

  it("counts overtime past 8 hours and announces it once", () => {
    const reached = run([{ type: "clockIn" }, ...ticks(30)]);
    expect(getWorkedMinutes(reached)).toBe(DEMO_REQUIRED_MINUTES);
    expect(reached.announcement).toBe("8 hours done. Overtime starts now.");

    const later = run(ticks(15), reached);
    expect(getOvertimeMinutes(later)).toBe(15);
    expect(later.announcement).toBe("");
  });

  it("records a session on clock out", () => {
    const state = run([
      { type: "clockIn" },
      ...ticks(40),
      { type: "clockOut" },
    ]);

    expect(state.clockedInAt).toBeNull();
    expect(state.sessions.at(-1)).toEqual({ start: 1037, end: 1077 });
    expect(state.announcement).toBe(
      "Clocked out. 8 hours 10 minutes worked today.",
    );
  });

  it("doesn't record an empty session when clocking straight back out", () => {
    const state = run([{ type: "clockIn" }, { type: "clockOut" }]);

    expect(state.sessions).toHaveLength(2);
    expect(state.clockedInAt).toBeNull();
  });

  it("ignores repeated clock-ins and clock-outs", () => {
    const clockedIn = run([{ type: "clockIn" }]);
    expect(run([{ type: "clockIn" }], clockedIn)).toBe(clockedIn);
    expect(run([{ type: "clockOut" }])).toBe(INITIAL_CLOCK_DEMO_STATE);
  });

  it("stops at the end of the day", () => {
    const state = run([{ type: "clockIn" }, ...ticks(2000)]);
    expect(state.now).toBe(23 * 60 + 59);
  });

  it("maps worked time onto the ring, capped at two laps", () => {
    expect(getRingValue(INITIAL_CLOCK_DEMO_STATE)).toBeCloseTo(93.75);

    // The longest demo day (clocked in until 23:59) is 852 min = 177.5%.
    const longestDay = run([{ type: "clockIn" }, ...ticks(2000)]);
    expect(getRingValue(longestDay)).toBeCloseTo(177.5);

    const marathon: ClockDemoState = {
      ...INITIAL_CLOCK_DEMO_STATE,
      sessions: [{ start: 0, end: 1000 }],
    };
    expect(getRingValue(marathon)).toBe(200);
  });

  it("resets to the starting day", () => {
    const state = run([{ type: "clockIn" }, ...ticks(10), { type: "reset" }]);
    expect(state).toEqual({
      ...INITIAL_CLOCK_DEMO_STATE,
      announcement: "Demo reset.",
    });
  });
});
