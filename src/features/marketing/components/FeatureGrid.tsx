import { CalendarCheck, ChartColumn, Timer, TrendingUp } from "lucide-react";

import { SectionHeading } from "./SectionHeading";

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
      id="features"
      aria-labelledby="features-title"
      className="scroll-mt-20 border-y bg-background"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          id="features-title"
          eyebrow="Features"
          title="Everything attendance needs, nothing it doesn't"
          description="Built for the two moments that matter: clocking in every morning, and closing the month."
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="group flex reveal flex-col gap-3 rounded-2xl border bg-card p-6 transition duration-200 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5 motion-safe:hover:-translate-y-1"
            >
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground"
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
