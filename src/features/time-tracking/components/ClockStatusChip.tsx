"use client";

import Link from "next/link";

import { useLiveNow } from "../hooks/useLiveNow";
import { formatTimer, secondsSince } from "../utils/clockDisplay";

import type { Route } from "next";

interface ClockStatusChipProps {
  href: Route;
  clockInAt: string;
  /** Org-local start, e.g. "09:02". */
  since: string;
  serverNow: number;
}

/**
 * The running timer in the top bar on every org page; rendered only while
 * clocked in (docs/design-system.md §3). Phones show just the dot.
 */
export function ClockStatusChip({
  href,
  clockInAt,
  since,
  serverNow,
}: ClockStatusChipProps) {
  const now = useLiveNow(serverNow, true);

  return (
    <Link
      href={href}
      aria-label={`Clocked in since ${since}. Open the dashboard`}
      className="flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-medium text-status-present-foreground hover:bg-status-present-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-3"
    >
      <span
        aria-hidden="true"
        className="live-dot size-2.5 rounded-full bg-status-live"
      />
      <span aria-hidden="true" className="tabular max-sm:hidden">
        {formatTimer(secondsSince(clockInAt, now))}
      </span>
    </Link>
  );
}
