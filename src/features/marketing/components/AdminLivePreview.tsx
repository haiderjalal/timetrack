import { StatusBadge } from "@/components/shared/StatusBadge";

import type { StatusTone } from "@/components/shared/StatusBadge";

interface TeammatePreview {
  initials: string;
  name: string;
  detail: string;
  tone: StatusTone;
  status: string;
}

// Illustrative team, as on the design canvas's live attendance board.
const TEAM: TeammatePreview[] = [
  {
    initials: "AK",
    name: "Ayesha Khan",
    detail: "since 08:56",
    tone: "present",
    status: "In · 7h 19m",
  },
  {
    initials: "BR",
    name: "Bilal Raza",
    detail: "since 09:24",
    tone: "short",
    status: "Late",
  },
  {
    initials: "UF",
    name: "Usman Farooq",
    detail: "Sick · full day",
    tone: "leave",
    status: "On leave",
  },
  {
    initials: "SM",
    name: "Sara Malik",
    detail: "shift 09:00",
    tone: "absent",
    status: "Not in yet",
  },
];

const MONTH = [
  { label: "Hours worked", value: "3,962h" },
  { label: "Overtime", value: "+142h" },
  { label: "Attendance", value: "96.4%" },
];

export function AdminLivePreview() {
  return (
    <div className="grid gap-6 rounded-2xl border bg-card p-6 shadow-xs md:grid-cols-[1fr_16rem] md:p-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="live-dot size-2 rounded-full bg-status-live"
          />
          <h3 className="font-semibold">Live attendance</h3>
          <span className="text-xs text-muted-foreground tabular">
            19 of 24 in
          </span>
        </div>
        <ul className="divide-y rounded-xl border">
          {TEAM.map((person) => (
            <li
              key={person.name}
              className="flex items-center gap-3 px-3 py-2.5 text-sm"
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand"
              >
                {person.initials}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{person.name}</span>
                <span className="truncate text-xs text-muted-foreground tabular">
                  {person.detail}
                </span>
              </span>
              <StatusBadge tone={person.tone}>{person.status}</StatusBadge>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3 self-start">
        <h3 className="text-sm font-semibold">Monthly report</h3>
        <dl className="grid grid-cols-3 gap-3 md:grid-cols-1">
          {MONTH.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-muted p-3 md:p-4">
              <dt className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="text-lg font-semibold tabular md:text-2xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted-foreground">
          Export any month to CSV in one click.
        </p>
      </div>
    </div>
  );
}
