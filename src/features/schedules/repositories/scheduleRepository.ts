import "server-only";

import { failDataAccess } from "@/lib/supabase/errors";
import { formatTimeValue } from "@/lib/time/formatDate";

import type { WorkSchedule } from "../types/schedule";
import type { TypedSupabaseClient } from "@/lib/supabase/server";

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
    .select(
      "effective_from, grace_minutes, days:work_schedule_days(weekday, is_working_day, start_time, end_time, required_minutes)",
    )
    .eq("org_id", orgId)
    .lte("effective_from", isoDate)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) failDataAccess("schedules.get_in_effect", error);
  if (!data) return null;

  return {
    effectiveFrom: data.effective_from,
    graceMinutes: data.grace_minutes,
    days: data.days
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
