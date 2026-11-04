interface LogoMarkProps {
  className?: string;
}

// 3/4 of the ring's circumference (2π × 8.5): the mark echoes the progress
// ring members see when they clock in.
const RING_CIRCUMFERENCE = 53.41;
const RING_ARC = RING_CIRCUMFERENCE * 0.75;

/** The TimeTrack mark: a brand tile with a progress arc and a clock hand. */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={`shrink-0 ${className ?? "size-7"}`}
    >
      <rect width="32" height="32" rx="8" className="fill-brand-mark" />
      <g
        fill="none"
        strokeLinecap="round"
        strokeWidth="2.6"
        className="stroke-brand-mark-foreground"
      >
        <circle cx="16" cy="16" r="8.5" strokeOpacity="0.3" />
        <circle
          cx="16"
          cy="16"
          r="8.5"
          strokeDasharray={`${RING_ARC} ${RING_CIRCUMFERENCE}`}
          transform="rotate(-90 16 16)"
        />
        <path d="M16 11.5V16l3 2" strokeWidth="2.2" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
