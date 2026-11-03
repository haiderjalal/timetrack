import { CalendarCheck, ChartColumn, Timer, TrendingUp } from "lucide-react";

import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Timer,
    title: "One-tap clock in",
    description:
      "Members clock in and out from any device. Times come from the server, so they can't be changed on a phone.",
  },
  {
    icon: TrendingUp,
    title: "Overtime counted for you",
    description:
      "Set the hours your team works each day. Time beyond them is recorded as overtime automatically.",
  },
  {
    icon: CalendarCheck,
    title: "Leave in a few taps",
    description:
      "Members request full or half days off. Owners and admins approve them, and reports update instantly.",
  },
  {
    icon: ChartColumn,
    title: "Monthly reports",
    description:
      "See days present, absences, leave, hours worked and overtime for every member, then export to CSV.",
  },
];

export function FeatureGrid() {
  return (
    <section
      aria-labelledby="features-title"
      className="border-y bg-background"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <h2
          id="features-title"
          className="text-2xl font-semibold tracking-tight"
        >
          Everything attendance needs, nothing it doesn&apos;t
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex flex-col gap-3">
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground"
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
