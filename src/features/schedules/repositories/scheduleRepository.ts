import "server-only";

import { failDataAccess } from "@/lib/supabase/errors";
import { formatTimeValue } from "@/lib/time/formatDate";

import type { WorkSchedule } from "../types/schedule";
import type { TypedSupabaseClient } from "@/lib/supabase/server";

const VERSION_COLUMNS =
  "effective_from, grace_minutes, days:work_schedule_days(weekday, is_working_day, start_time, end_time, required_minutes)";

interface VersionRow {
  effective_from: string;
  grace_minutes: number;
  days: {
    weekday: number;
    is_working_day: boolean;
    start_time: string | null;
    end_time: string | null;
    required_minutes: number;
  }[];
}

/**
 * The working-hours version in effect on `isoDate` (org-local): the newest one
 * that started on or before it. Null if the org's first version starts later.
 */
export async function getScheduleInEffect(
  supabase: TypedSupabaseClient,
  orgId: string,
  isoDate: string,
): Promise<WorkSchedule | null> {
  const { data, error } = await supabase
    .from("work_schedules")
    .select(VERSION_COLUMNS)
    .eq("org_id", orgId)
    .lte("effective_from", isoDate)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) failDataAccess("schedules.get_in_effect", error);
  return data ? toWorkSchedule(data) : null;
}

/**
 * Every version that applies to some day from `fromDate` to `toDate`: the one
 * in effect on `fromDate` and any that start later in the range. Newest first.
 */
export async function listScheduleVersions(
  supabase: TypedSupabaseClient,
  orgId: string,
  fromDate: string,
  toDate: string,
): Promise<WorkSchedule[]> {
  const [inEffect, later] = await Promise.all([
    getScheduleInEffect(supabase, orgId, fromDate),
    supabase
      .from("work_schedules")
      .select(VERSION_COLUMNS)
      .eq("org_id", orgId)
      .gt("effective_from", fromDate)
      .lte("effective_from", toDate)
      .order("effective_from", { ascending: false }),
  ]);

  if (later.error) failDataAccess("schedules.list_versions", later.error);
  const versions = later.data.map(toWorkSchedule);
  return inEffect ? [...versions, inEffect] : versions;
}

function toWorkSchedule(row: VersionRow): WorkSchedule {
  return {
    effectiveFrom: row.effective_from,
    graceMinutes: row.grace_minutes,
    days: row.days
      .map((day) => ({
        weekday: day.weekday,
        isWorkingDay: day.is_working_day,
        startTime: day.start_time ? formatTimeValue(day.start_time) : null,
        endTime: day.end_time ? formatTimeValue(day.end_time) : null,
        requiredMinutes: day.required_minutes,
      }))
      .sort((a, b) => a.weekday - b.weekday),
  };
}
