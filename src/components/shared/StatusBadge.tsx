import type { ReactNode } from "react";

export type StatusTone =
  "present" | "short" | "absent" | "leave" | "overtime" | "off";

// Full class names so Tailwind can see them (no string building).
const TONE_CLASSES: Record<StatusTone, { badge: string; dot: string }> = {
  present: {
    badge: "bg-status-present-soft text-status-present-foreground",
    dot: "bg-status-present",
  },
  short: {
    badge: "bg-status-short-soft text-status-short-foreground",
    dot: "bg-status-short",
  },
  absent: {
    badge: "bg-status-absent-soft text-status-absent-foreground",
    dot: "bg-status-absent",
  },
  leave: {
    badge: "bg-status-leave-soft text-status-leave-foreground",
    dot: "bg-status-leave",
  },
  overtime: {
    badge: "bg-status-overtime-soft text-status-overtime-foreground",
    dot: "bg-status-overtime",
  },
  off: {
    badge: "bg-status-off-soft text-status-off-foreground",
    dot: "bg-status-off",
  },
};

interface StatusBadgeProps {
  tone: StatusTone;
  /** Always a visible label: status is never shown by color alone. */
  children: ReactNode;
}

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  const classes = TONE_CLASSES[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${classes.badge}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${classes.dot}`}
      />
      {children}
    </span>
  );
}
