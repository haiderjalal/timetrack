// Worked 6h 12m of an 8h day, drawn on a ring of radius 96.
const RING_CIRCUMFERENCE = 2 * Math.PI * 96;
const PREVIEW_PROGRESS = 372 / 480;

/** A static picture of the product's clock card for the landing page. */
export function ClockPreview() {
  return (
    <div
      role="img"
      aria-label="TimeTrack clock card: clocked in since 14:01, 6 hours 12 minutes of 8 hours worked today"
      className="mx-auto w-full max-w-md rounded-2xl border bg-card p-6 shadow-xs sm:p-8"
    >
      <div aria-hidden="true" className="flex flex-col items-center gap-6">
        <div className="flex w-full items-center justify-between text-sm">
          <span className="font-medium">Today</span>
          <span className="text-muted-foreground">Shift 09:00 – 18:00</span>
        </div>

        <div className="relative size-48">
          <svg viewBox="0 0 220 220" className="size-full -rotate-90">
            <circle
              cx="110"
              cy="110"
              r="96"
              fill="none"
              strokeWidth="14"
              className="stroke-muted"
            />
            <circle
              cx="110"
              cy="110"
              r="96"
              fill="none"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${RING_CIRCUMFERENCE * PREVIEW_PROGRESS} ${RING_CIRCUMFERENCE}`}
              className="stroke-status-present"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold tracking-tight tabular">
              6h 12m
            </span>
            <span className="text-sm text-muted-foreground">of 8h today</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="flex items-center gap-2 text-sm font-semibold text-status-present-foreground">
            <span className="size-2.5 rounded-full bg-status-live ring-4 ring-status-present-soft" />
            Clocked in since 14:01
          </span>
          <span className="text-sm text-muted-foreground tabular">
            1h 48m to go
          </span>
        </div>

        <span className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground">
          Clock out
        </span>
      </div>
    </div>
  );
}
