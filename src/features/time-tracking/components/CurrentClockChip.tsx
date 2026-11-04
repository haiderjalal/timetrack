import { orgDashboardPath } from "@/constants/routes";
import { formatTimeInZone } from "@/lib/time/formatDate";

import { getRunningSession } from "../services/timeTracking";
import { ClockStatusChip } from "./ClockStatusChip";

import type { RunningSession } from "../services/timeTracking";

interface CurrentClockChipProps {
  orgId: string;
  orgSlug: string;
  userId: string;
  timeZone: string;
}

/** The top bar's running timer, when the person is clocked in to this org. */
export async function CurrentClockChip({
  orgId,
  orgSlug,
  userId,
  timeZone,
}: CurrentClockChipProps) {
  let running: RunningSession | null;
  try {
    running = await getRunningSession(orgId, userId);
  } catch {
    // Already logged by the repository. A missing timer mustn't break the shell.
    return null;
  }
  if (!running) return null;

  return (
    <ClockStatusChip
      href={orgDashboardPath(orgSlug)}
      clockInAt={running.entry.clockInAt}
      since={formatTimeInZone(running.entry.clockInAt, timeZone)}
      serverNow={running.serverNow}
    />
  );
}
