"use server";

import { refresh } from "next/cache";

import { requireMembership } from "@/features/organizations/services/membership";
import { logger } from "@/lib/logger";
import { formatTimeInZone } from "@/lib/time/formatDate";
import { clockInSchema, clockOutSchema } from "@/lib/validations/clock.schema";

import { clockInForMember, clockOutForMember } from "../services/timeTracking";
import { describeClockFailure } from "../utils/clockErrors";

import type { TimeEntry } from "../types/timeEntry";
import type {
  ClockInInput,
  ClockOutInput,
} from "@/lib/validations/clock.schema";
import type { ApiResponse } from "@/types/api";

export type ClockActionResult = ApiResponse<{ entry: TimeEntry }>;

const INVALID_REQUEST = {
  success: false,
  message:
    "Something about that request wasn't right. Reload the page and try again.",
} as const;

/**
 * Starts a session now. Members never send a time: the database records its
 * own clock (business-rules.md §3). Every outcome refreshes the page, so the
 * card shows the real state even after a refusal (e.g. a second tab).
 */
export async function clockIn(input: ClockInInput): Promise<ClockActionResult> {
  const parsed = clockInSchema.safeParse(input);
  if (!parsed.success) return INVALID_REQUEST;

  const { user, membership } = await requireMembership(parsed.data.orgSlug);
  const { organization } = membership;
  const result = await clockInForMember(organization.id);
  refresh();

  if (!result.ok) return describeClockFailure(result.failure, "clock_in");

  logger.info("time_entry.clocked_in", {
    orgId: organization.id,
    userId: user.id,
  });
  return {
    success: true,
    message: `Clocked in at ${formatTimeInZone(result.entry.clockInAt, organization.timezone)}.`,
    data: { entry: result.entry },
  };
}

/** Ends the open session now, with an optional note (≤ 500 characters). */
export async function clockOut(
  input: ClockOutInput,
): Promise<ClockActionResult> {
  const parsed = clockOutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ...INVALID_REQUEST,
      message: "Check your note and try again.",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    };
  }

  const { user, membership } = await requireMembership(parsed.data.orgSlug);
  const { organization } = membership;
  const result = await clockOutForMember(organization.id, parsed.data.note);
  refresh();

  if (!result.ok) return describeClockFailure(result.failure, "clock_out");

  const { entry } = result;
  const clockOutTime = entry.clockOutAt
    ? formatTimeInZone(entry.clockOutAt, organization.timezone)
    : "";
  logger.info("time_entry.clocked_out", {
    orgId: organization.id,
    userId: user.id,
    autoClosed: entry.autoClosed,
  });

  return {
    success: true,
    message: entry.autoClosed
      ? `Your session was already past its limit, so it was closed automatically at ${clockOutTime}. Ask an admin to correct it if needed.`
      : `Clocked out at ${clockOutTime}.`,
    data: { entry },
  };
}
