"use client";

import { useId, useState, useTransition } from "react";
import {
  LoaderCircle,
  LogIn,
  LogOut,
  NotebookPen,
  RotateCcw,
  TreePalm,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import { describedBy, FieldError } from "@/components/forms/FieldError";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { buttonVariants } from "@/components/ui/button-variants";
import { Textarea } from "@/components/ui/textarea";
import {
  describeDuration,
  formatDuration,
  formatSignedDuration,
} from "@/lib/time/formatDuration";
import { CLOCK_NOTE_MAX_LENGTH } from "@/lib/validations/clock.schema";

import { clockIn, clockOut } from "../actions/clock";
import { useLiveNow } from "../hooks/useLiveNow";
import { formatTimer, getRingValue, secondsSince } from "../utils/clockDisplay";

import type { ClockActionResult } from "../actions/clock";

type ClockAction = "clock_in" | "clock_out";

interface Feedback {
  tone: "success" | "error";
  message: string;
  noteError?: string;
  /** What "Try again" repeats. */
  retry?: ClockAction;
}

export interface ClockCardProps {
  orgSlug: string;
  /** Date.now() on the server when the page was rendered. */
  serverNow: number;
  /** The running session, if any; `time` is its org-local start, e.g. "09:02". */
  running: { clockInAt: string; time: string } | null;
  /** Time already worked on this day in closed sessions. */
  closedSeconds: number;
  requiredMinutes: number;
  isWorkingDay: boolean;
  /** Set when the latest session was closed automatically: its clock-out time. */
  autoClosedAt: string | null;
}

/**
 * Clock in and out, with today's progress (docs/design-system.md §3 ClockCard,
 * §6.1). The page re-renders from the server after each action; this only
 * keeps the timer moving and shows pending and error states in between.
 */
export function ClockCard({
  orgSlug,
  serverNow,
  running,
  closedSeconds,
  requiredMinutes,
  isWorkingDay,
  autoClosedAt,
}: ClockCardProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const ids = useId();
  const noteId = `${ids}-note`;
  const noteErrorId = `${ids}-note-error`;
  const noteCountId = `${ids}-note-count`;

  const now = useLiveNow(serverNow, running !== null);
  const sessionSeconds = running ? secondsSince(running.clockInAt, now) : 0;
  const workedMinutes = Math.floor((closedSeconds + sessionSeconds) / 60);
  const overtimeMinutes = Math.max(0, workedMinutes - requiredMinutes);
  const remainingMinutes = Math.max(0, requiredMinutes - workedMinutes);

  function run(action: ClockAction) {
    startTransition(async () => {
      let result: ClockActionResult;
      try {
        result =
          action === "clock_in"
            ? await clockIn({ orgSlug })
            : await clockOut({ orgSlug, note });
      } catch {
        result = {
          success: false,
          message:
            action === "clock_in"
              ? "Couldn't clock you in. Check your connection and try again."
              : "Couldn't clock you out. Check your connection and try again.",
        };
      }

      startTransition(() => {
        if (result.success) {
          setFeedback({ tone: "success", message: result.message });
          if (action === "clock_out") {
            setNote("");
            setIsNoteOpen(false);
          }
          return;
        }
        const noteError = result.errors?.find(
          (error) => error.field === "note",
        )?.message;
        setFeedback({
          tone: "error",
          message: result.message,
          noteError,
          retry: noteError ? undefined : action,
        });
        if (noteError) setIsNoteOpen(true);
      });
    });
  }

  const action: ClockAction = running ? "clock_out" : "clock_in";

  return (
    <div className="flex flex-col gap-6">
      {autoClosedAt && !running ? (
        <p className="flex gap-3 rounded-lg border border-status-short/40 bg-status-short-soft px-4 py-3 text-sm text-status-short-foreground">
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span>
            We closed your last session automatically at{" "}
            <span className="tabular">{autoClosedAt}</span>. Ask an admin to
            correct it if needed.
          </span>
        </p>
      ) : null}

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        {isWorkingDay && requiredMinutes > 0 ? (
          <ProgressRing
            value={getRingValue(workedMinutes, requiredMinutes)}
            label="Time worked today"
            valueText={`${describeDuration(workedMinutes)} of ${describeDuration(requiredMinutes)}`}
            className="size-44 shrink-0 sm:size-48"
          >
            <span className="text-3xl font-semibold tracking-tight tabular">
              {formatDuration(workedMinutes)}
            </span>
            <span className="text-sm text-muted-foreground tabular">
              of {formatDuration(requiredMinutes)}
            </span>
          </ProgressRing>
        ) : (
          <div className="flex size-44 shrink-0 flex-col items-center justify-center gap-1 rounded-full bg-status-off-soft text-center sm:size-48">
            <TreePalm
              className="size-6 text-status-off-foreground"
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-status-off-foreground">
              Day off
            </span>
            <span className="text-2xl font-semibold tracking-tight tabular">
              {formatDuration(workedMinutes)}
            </span>
            <span className="sr-only">
              worked today: {describeDuration(workedMinutes)}
            </span>
          </div>
        )}

        <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
          {running ? (
            <>
              <p className="flex items-center gap-2 text-sm font-semibold text-status-present-foreground">
                <span
                  aria-hidden="true"
                  className="live-dot size-2.5 rounded-full bg-status-live"
                />
                You&apos;re clocked in since{" "}
                <span className="tabular">{running.time}</span>
              </p>
              <p
                className="text-5xl font-semibold tracking-tight tabular sm:text-display"
                aria-hidden="true"
              >
                {formatTimer(sessionSeconds)}
              </p>
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full bg-status-off"
              />
              {workedMinutes > 0 ? "You're clocked out" : "Not clocked in yet"}
            </p>
          )}
          <DayProgress
            isWorkingDay={isWorkingDay}
            requiredMinutes={requiredMinutes}
            overtimeMinutes={overtimeMinutes}
            remainingMinutes={remainingMinutes}
            workedMinutes={workedMinutes}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => run(action)}
            disabled={isPending}
            className={buttonVariants({
              size: "lg",
              variant: running ? "outline" : "default",
              className: "w-full sm:w-48",
            })}
          >
            {isPending ? (
              <LoaderCircle
                className="opacity-60 motion-safe:animate-spin motion-safe:opacity-100"
                aria-hidden="true"
              />
            ) : running ? (
              <LogOut aria-hidden="true" />
            ) : (
              <LogIn aria-hidden="true" />
            )}
            {isPending
              ? running
                ? "Clocking out…"
                : "Clocking in…"
              : running
                ? "Clock out"
                : "Clock in"}
          </button>
          {running ? (
            <button
              type="button"
              aria-expanded={isNoteOpen}
              aria-controls={noteId}
              onClick={() => {
                if (isNoteOpen) setNote("");
                setIsNoteOpen(!isNoteOpen);
              }}
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              <NotebookPen aria-hidden="true" />
              {isNoteOpen ? "Discard note" : "Add note"}
            </button>
          ) : null}
        </div>

        {running && isNoteOpen ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={noteId} className="text-sm font-medium">
              Note for this session{" "}
              <span className="font-normal text-muted-foreground">
                (optional, saved when you clock out)
              </span>
            </label>
            <Textarea
              id={noteId}
              value={note}
              maxLength={CLOCK_NOTE_MAX_LENGTH}
              onChange={(event) => setNote(event.target.value)}
              aria-invalid={feedback?.noteError ? true : undefined}
              aria-describedby={describedBy(
                noteCountId,
                feedback?.noteError && noteErrorId,
              )}
              className="max-w-xl"
            />
            <p
              id={noteCountId}
              className="text-xs text-muted-foreground tabular"
            >
              {note.length}/{CLOCK_NOTE_MAX_LENGTH} characters
            </p>
            <FieldError id={noteErrorId} message={feedback?.noteError} />
          </div>
        ) : null}

        {feedback?.tone === "error" ? (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{feedback.message}</span>
            {feedback.retry ? (
              <button
                type="button"
                onClick={() => feedback.retry && run(feedback.retry)}
                disabled={isPending}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <RotateCcw aria-hidden="true" />
                Try again
              </button>
            ) : null}
          </div>
        ) : null}

        {/* State changes are announced once, never the ticking timer (design-system §7). */}
        <p role="status" className="sr-only">
          {feedback?.tone === "success" ? feedback.message : ""}
        </p>
      </div>
    </div>
  );
}

interface DayProgressProps {
  isWorkingDay: boolean;
  requiredMinutes: number;
  workedMinutes: number;
  overtimeMinutes: number;
  remainingMinutes: number;
}

function DayProgress({
  isWorkingDay,
  requiredMinutes,
  workedMinutes,
  overtimeMinutes,
  remainingMinutes,
}: DayProgressProps) {
  if (!isWorkingDay) {
    return (
      <p className="text-sm text-muted-foreground">
        Day off. Any time you work today counts as overtime.
      </p>
    );
  }
  if (overtimeMinutes > 0) {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-status-overtime-foreground">
        <TrendingUp className="size-4" aria-hidden="true" />
        <span className="tabular">{formatSignedDuration(overtimeMinutes)}</span>
        overtime
      </p>
    );
  }
  if (workedMinutes >= requiredMinutes) {
    return (
      <p className="text-sm text-muted-foreground">
        {formatDuration(requiredMinutes)} done. Any more time counts as
        overtime.
      </p>
    );
  }
  return (
    <p className="text-sm text-muted-foreground">
      <span className="tabular">{formatDuration(remainingMinutes)}</span> to go
    </p>
  );
}
