import "server-only";

import { countActiveMembers } from "@/features/organizations/repositories/organizationRepository";
import { getScheduleInEffect } from "@/features/schedules/repositories/scheduleRepository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getZonedNow } from "@/lib/time/zonedNow";

import type { Organization } from "@/features/organizations/types/organization";
import type {
  ScheduleDay,
  WorkSchedule,
} from "@/features/schedules/types/schedule";
import type { ZonedNow } from "@/lib/time/zonedNow";

export interface DashboardOverview {
  /** Now, in the org timezone. */
  now: ZonedNow;
  /** The working hours in effect today, or null before the first version starts. */
  schedule: WorkSchedule | null;
  today: ScheduleDay | null;
  memberCount: number;
}

/** Everything the dashboard shows, loaded in parallel under the person's RLS. */
export async function getDashboardOverview(
  organization: Organization,
): Promise<DashboardOverview> {
  const now = getZonedNow(organization.timezone);
  const supabase = await createSupabaseServerClient();

  const [schedule, memberCount] = await Promise.all([
    getScheduleInEffect(supabase, organization.id, now.isoDate),
    countActiveMembers(supabase, organization.id),
  ]);

  return {
    now,
    schedule,
    today: schedule?.days.find((day) => day.weekday === now.weekday) ?? null,
    memberCount,
  };
}
