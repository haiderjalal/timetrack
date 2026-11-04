"use client";

import { describeDuration, formatDuration } from "@/lib/time/formatDuration";

import { useLiveNow } from "../hooks/useLiveNow";
import { secondsSince } from "../utils/clockDisplay";

interface LiveDurationProps {
  since: string;
  serverNow: number;
}

/** A running session's length (`2h 14m`), kept current every second. */
export function LiveDuration({ since, serverNow }: LiveDurationProps) {
  const now = useLiveNow(serverNow, true);
  const minutes = Math.floor(secondsSince(since, now) / 60);

  return (
    <>
      <span aria-hidden="true">{formatDuration(minutes)}</span>
      <span className="sr-only">{describeDuration(minutes)} so far</span>
    </>
  );
}
