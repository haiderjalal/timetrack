"use client";

import { useEffect, useReducer } from "react";
import { LogIn, LogOut, RotateCcw, TrendingUp } from "lucide-react";

import { ProgressRing } from "@/components/shared/ProgressRing";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  describeDuration,
  formatClockTime,
  formatDuration,
  formatSignedDuration,
} from "@/lib/time/formatDuration";

import {
  INITIAL_CLOCK_DEMO_STATE,
  clockDemoReducer,
  getOvertimeMinutes,
  getRemainingMinutes,
  getRingValue,
  getWorkedMinutes,
} from "../utils/clockDemo";

/** One real second moves the demo clock one minute. */
const DEMO_TICK_MS = 1000;
const VISIBLE_SESSIONS = 3;

/** The landing page's hands-on clock: try clocking in and watch overtime start. */
export function ClockDemo() {
  const [state, dispatch] = useReducer(
    clockDemoReducer,
    INITIAL_CLOCK_DEMO_STATE,
  );
  const isClockedIn = state.clockedInAt !== null;

  useEffect(() => {
    if (!isClockedIn) return;
    const timer = window.setInterval(
      () => dispatch({ type: "tick" }),
      DEMO_TICK_MS,
    );
    return () => window.clearInterval(timer);
  }, [isClockedIn]);

  const worked = getWorkedMinutes(state);
  const overtime = getOvertimeMinutes(state);
  const remaining = getRemainingMinutes(state);
  const sessions = [
    ...state.sessions.map((session) => ({ ...session, isOpen: false })),
    ...(state.clockedInAt === null
      ? []
      : [{ start: state.clockedInAt, end: state.now, isOpen: true }]),
  ].slice(-VISIBLE_SESSIONS);

  return (
    <section
      aria-labelledby="clock-demo-title"
      className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-card p-6 shadow-xl shadow-brand/10 sm:p-8"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="clock-demo-title" className="text-sm font-semibold">
          Try it · Today
        </h2>
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
          Demo: 1 second = 1 minute
        </span>
      </div>

      <ProgressRing
        value={getRingValue(state)}
        label="Hours worked today"
        valueText={`${describeDuration(worked)} of 8 hours`}
        className="mx-auto size-48"
      >
        <span className="text-3xl font-semibold tracking-tight tabular">
          {formatDuration(worked)}
        </span>
        <span className="text-sm text-muted-foreground">of 8h today</span>
      </ProgressRing>

      <div className="flex flex-col items-center gap-1 text-sm">
        {isClockedIn ? (
          <span className="flex items-center gap-2 font-semibold text-status-present-foreground">
            <span
              aria-hidden="true"
              className="live-dot size-2.5 rounded-full bg-status-live"
            />
            Clocked in since {formatClockTime(state.clockedInAt ?? state.now)}
          </span>
        ) : (
          <span className="flex items-center gap-2 font-semibold text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-status-off"
            />
            Clocked out · {formatClockTime(state.now)}
          </span>
        )}
        {overtime > 0 ? (
          <span className="flex items-center gap-1.5 font-medium text-status-overtime-foreground tabular">
            <TrendingUp className="size-4" aria-hidden="true" />
            {formatSignedDuration(overtime)} overtime
          </span>
        ) : (
          <span className="text-muted-foreground tabular">
            {formatDuration(remaining)} to go
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: isClockedIn ? "clockOut" : "clockIn" })}
        className={buttonVariants({ size: "lg", className: "w-full" })}
      >
        {isClockedIn ? (
          <LogOut aria-hidden="true" />
        ) : (
          <LogIn aria-hidden="true" />
        )}
        {isClockedIn ? "Clock out" : "Clock in"}
      </button>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-muted-foreground">
            Sessions
          </h3>
          <button
            type="button"
            onClick={() => dispatch({ type: "reset" })}
            className={buttonVariants({ variant: "ghost", size: "xs" })}
          >
            <RotateCcw aria-hidden="true" />
            Reset demo
          </button>
        </div>
        <ul className="divide-y rounded-lg border text-sm">
          {sessions.map((session) => (
            <li
              key={session.start}
              className="flex items-center justify-between gap-3 px-3 py-2 tabular"
            >
              <span>
                {formatClockTime(session.start)} →{" "}
                {session.isOpen ? (
                  <span className="text-status-present-foreground">now</span>
                ) : (
                  formatClockTime(session.end)
                )}
              </span>
              <span className="font-medium">
                {formatDuration(session.end - session.start)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p aria-live="polite" className="sr-only">
        {state.announcement}
      </p>
    </section>
  );
}
