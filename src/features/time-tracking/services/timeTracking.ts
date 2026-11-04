import "server-only";

import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  clockInRecord,
  clockOutRecord,
  getLatestEntry,
  listEntries,
} from "../repositories/timeEntryRepository";

import type { ClockResult } from "../repositories/timeEntryRepository";
import type { TimeEntry } from "../types/timeEntry";

/**
 * The person's latest session, read once per request: the top bar's running
 * timer and the dashboard both need it.
 */
export const getLatestEntryForMember = cache(
  async (orgId: string, userId: string): Promise<TimeEntry | null> => {
    const supabase = await createSupabaseServerClient();
    return getLatestEntry(supabase, orgId, userId);
  },
);

export interface RunningSession {
  entry: TimeEntry;
  /** When it was read, as epoch milliseconds, for the live timer. */
  serverNow: number;
}

/** The person's open session in an org, or null when clocked out. */
export async function getRunningSession(
  orgId: string,
  userId: string,
): Promise<RunningSession | null> {
  const latest = await getLatestEntryForMember(orgId, userId);
  if (!latest || latest.clockOutAt !== null) return null;
  return { entry: latest, serverNow: Date.now() };
}

export async function listEntriesForMember(
  orgId: string,
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<TimeEntry[]> {
  const supabase = await createSupabaseServerClient();
  return listEntries(supabase, orgId, userId, fromDate, toDate);
}

/** Clock-in for the signed-in person; the database checks the membership again. */
export async function clockInForMember(orgId: string): Promise<ClockResult> {
  const supabase = await createSupabaseServerClient();
  return clockInRecord(supabase, orgId);
}

export async function clockOutForMember(
  orgId: string,
  note: string | undefined,
): Promise<ClockResult> {
  const supabase = await createSupabaseServerClient();
  return clockOutRecord(supabase, orgId, note || undefined);
}
