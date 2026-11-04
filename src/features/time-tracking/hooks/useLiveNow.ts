"use client";

import { useState, useSyncExternalStore } from "react";

// One shared one-second ticker for every live timer on the page.
const listeners = new Set<() => void>();
let ticker: ReturnType<typeof setInterval> | undefined;

function subscribeToSeconds(onTick: () => void): () => void {
  listeners.add(onTick);
  ticker ??= setInterval(
    () => listeners.forEach((listener) => listener()),
    1000,
  );
  return () => {
    listeners.delete(onTick);
    if (listeners.size === 0) {
      clearInterval(ticker);
      ticker = undefined;
    }
  };
}

function subscribeToNothing(): () => void {
  return () => {};
}

function getCurrentSecond(): number {
  return Math.floor(Date.now() / 1000);
}

function getNoSecond(): null {
  return null;
}

interface Anchor {
  serverNow: number;
  second: number | null;
}

/**
 * The server's "now", moving forward one second at a time while `isRunning`.
 * It counts seconds elapsed on this device since the page arrived, so a wrong
 * device clock never skews a timer (docs/architecture.md §6.4). The server
 * render and hydration both show `serverNow`, so the markup always matches.
 */
export function useLiveNow(serverNow: number, isRunning: boolean): number {
  const second = useSyncExternalStore(
    isRunning ? subscribeToSeconds : subscribeToNothing,
    getCurrentSecond,
    getNoSecond,
  );
  const [anchor, setAnchor] = useState<Anchor>({ serverNow, second });

  // A refresh brings a new serverNow; start counting from it.
  if (
    anchor.serverNow !== serverNow ||
    (anchor.second === null && second !== null)
  ) {
    setAnchor({ serverNow, second });
  }

  if (second === null || anchor.second === null) return serverNow;
  return anchor.serverNow + (second - anchor.second) * 1000;
}
