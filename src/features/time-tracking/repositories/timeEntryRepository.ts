import "server-only";

import { failDataAccess, logDataAccessFailure } from "@/lib/supabase/errors";

import { toClockFailure } from "../utils/clockErrors";

import type { TimeEntry } from "../types/timeEntry";
import type { ClockFailure } from "../utils/clockErrors";
import type { TypedSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

const ENTRY_COLUMNS =
  "id, work_date, clock_in_at, clock_out_at, clock_in_source, auto_closed, note";

type EntryRow = Pick<
  Tables<"time_entries">,
  | "id"
  | "work_date"
  | "clock_in_at"
  | "clock_out_at"
  | "clock_in_source"
  | "auto_closed"
  | "note"
>;

export type ClockResult =
  { ok: true; entry: TimeEntry } | { ok: false; failure: ClockFailure };

/**
 * The person's most recent session in an org. Sessions can't overlap, so an
 * open session is always the latest one.
 */
export async function getLatestEntry(
  supabase: TypedSupabaseClient,
  orgId: string,
  userId: string,
): Promise<TimeEntry | null> {
  const { data, error } = await supabase
    .from("time_entries")
    .select(ENTRY_COLUMNS)
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .order("work_date", { ascending: false })
    .order("clock_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) failDataAccess("time_entries.get_latest", error);
  return data ? toTimeEntry(data) : null;
}

/** The person's sessions with a work date from `fromDate` to `toDate`, oldest first. */
export async function listEntries(
  supabase: TypedSupabaseClient,
  orgId: string,
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from("time_entries")
    .select(ENTRY_COLUMNS)
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .gte("work_date", fromDate)
    .lte("work_date", toDate)
    .order("clock_in_at", { ascending: true });

  if (error) failDataAccess("time_entries.list", error);
  return data.map(toTimeEntry);
}

/** clock_in(): the database sets the time and the work date. */
export async function clockInRecord(
  supabase: TypedSupabaseClient,
  orgId: string,
): Promise<ClockResult> {
  const { data, error } = await supabase.rpc("clock_in", { p_org_id: orgId });
  if (error) return toClockError("time_entries.clock_in", error);
  return { ok: true, entry: toTimeEntry(data) };
}

/** clock_out(): closes the person's open session with the database's time. */
export async function clockOutRecord(
  supabase: TypedSupabaseClient,
  orgId: string,
  note: string | undefined,
): Promise<ClockResult> {
  const { data, error } = await supabase.rpc("clock_out", {
    p_org_id: orgId,
    p_note: note,
  });
  if (error) return toClockError("time_entries.clock_out", error);
  return { ok: true, entry: toTimeEntry(data) };
}

function toClockError(
  operation: string,
  error: { code?: string; message?: string },
): ClockResult {
  const failure = toClockFailure(error.message);
  if (failure === "unknown") logDataAccessFailure(operation, error);
  return { ok: false, failure };
}

function toTimeEntry(row: EntryRow): TimeEntry {
  return {
    id: row.id,
    workDate: row.work_date,
    clockInAt: row.clock_in_at,
    clockOutAt: row.clock_out_at,
    clockInSource: row.clock_in_source,
    autoClosed: row.auto_closed,
    note: row.note,
  };
}
