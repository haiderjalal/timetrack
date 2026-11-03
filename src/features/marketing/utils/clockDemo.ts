import { describeDuration, formatClockTime } from "@/lib/time/formatDuration";

/**
 * State machine for the landing page's interactive clock. Demo time only:
 * nothing is stored, and one tick is one minute (the UI ticks every second,
 * so the day runs 60× faster).
 */

export const DEMO_REQUIRED_MINUTES = 8 * 60;
const LAST_MINUTE_OF_DAY = 23 * 60 + 59;

export interface DemoSession {
  start: number;
  end: number;
}

export interface ClockDemoState {
  /** Finished sessions, as minutes of the day. */
  sessions: DemoSession[];
  /** Start of the open session, or null when clocked out. */
  clockedInAt: number | null;
  /** The demo's current time (minute of the day). */
  now: number;
  /** One sentence for the aria-live region; empty when nothing changed. */
  announcement: string;
}

export type ClockDemoAction =
  | { type: "clockIn" }
  | { type: "clockOut" }
  | { type: "tick" }
  | { type: "reset" };

// A realistic day so far: 7h 30m worked, half an hour from the 8h target.
export const INITIAL_CLOCK_DEMO_STATE: ClockDemoState = {
  sessions: [
    { start: 9 * 60 + 2, end: 13 * 60 },
    { start: 13 * 60 + 45, end: 17 * 60 + 17 },
  ],
  clockedInAt: null,
  now: 17 * 60 + 17,
  announcement: "",
};

export function getWorkedMinutes(state: ClockDemoState): number {
  const finished = state.sessions.reduce(
    (total, session) => total + (session.end - session.start),
    0,
  );
  const open = state.clockedInAt === null ? 0 : state.now - state.clockedInAt;
  return finished + open;
}

export function getOvertimeMinutes(state: ClockDemoState): number {
  return Math.max(0, getWorkedMinutes(state) - DEMO_REQUIRED_MINUTES);
}

export function getRemainingMinutes(state: ClockDemoState): number {
  return Math.max(0, DEMO_REQUIRED_MINUTES - getWorkedMinutes(state));
}

/** 0–200: the progress ring's value, where 100 is a full 8h day. */
export function getRingValue(state: ClockDemoState): number {
  return Math.min(200, (getWorkedMinutes(state) / DEMO_REQUIRED_MINUTES) * 100);
}

export function clockDemoReducer(
  state: ClockDemoState,
  action: ClockDemoAction,
): ClockDemoState {
  switch (action.type) {
    case "clockIn": {
      if (state.clockedInAt !== null) return state;
      return {
        ...state,
        clockedInAt: state.now,
        announcement: `Clocked in at ${formatClockTime(state.now)}.`,
      };
    }

    case "clockOut": {
      if (state.clockedInAt === null) return state;
      // Out in the same minute: nothing worth recording as a session.
      if (state.now === state.clockedInAt) {
        return { ...state, clockedInAt: null, announcement: "Clocked out." };
      }
      const next: ClockDemoState = {
        ...state,
        sessions: [
          ...state.sessions,
          { start: state.clockedInAt, end: state.now },
        ],
        clockedInAt: null,
      };
      return {
        ...next,
        announcement: `Clocked out. ${describeDuration(getWorkedMinutes(next))} worked today.`,
      };
    }

    case "tick": {
      if (state.clockedInAt === null || state.now >= LAST_MINUTE_OF_DAY) {
        return state;
      }
      const next = { ...state, now: state.now + 1, announcement: "" };
      const reachedTarget =
        getWorkedMinutes(state) < DEMO_REQUIRED_MINUTES &&
        getWorkedMinutes(next) >= DEMO_REQUIRED_MINUTES;

      return reachedTarget
        ? { ...next, announcement: "8 hours done. Overtime starts now." }
        : next;
    }

    case "reset":
      return { ...INITIAL_CLOCK_DEMO_STATE, announcement: "Demo reset." };
  }
}
