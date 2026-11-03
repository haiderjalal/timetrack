import { Check } from "lucide-react";

import { Logo } from "@/components/shared/Logo";
import { ProgressRing } from "@/components/shared/ProgressRing";

const VALUE_POINTS = [
  "Clock in and out with one tap, on any device",
  "Overtime and short days worked out for you",
  "Leave requests and approvals in one place",
];

/** The branded half of the sign-in page (large screens only). */
export function SignInBrandPanel() {
  return (
    <aside
      aria-label="About TimeTrack"
      className="relative hidden flex-col justify-between gap-12 overflow-hidden bg-brand-mark p-12 text-brand-mark-foreground lg:flex"
    >
      <Logo className="text-brand-mark-foreground" />

      <div className="flex flex-col gap-10">
        <ProgressRing
          value={100}
          label="Example day"
          valueText="8 hours of 8 hours: a complete day"
          fillOnLoad
          variant="on-brand"
          className="size-40"
        >
          <span className="text-2xl font-semibold tabular">8h</span>
          <span className="text-xs text-brand-mark-muted">day complete</span>
        </ProgressRing>

        <div className="flex max-w-md flex-col gap-4">
          <p className="text-3xl font-semibold tracking-tight text-balance">
            Every hour, accounted for.
          </p>
          <ul className="flex flex-col gap-3 text-brand-mark-muted">
            {VALUE_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <Check
                  className="mt-0.5 size-5 shrink-0 text-brand-mark-foreground"
                  aria-hidden="true"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-sm text-brand-mark-muted">
        Attendance and time tracking for teams.
      </p>
    </aside>
  );
}
