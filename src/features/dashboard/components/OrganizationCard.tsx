import { Building2 } from "lucide-react";

import { ROLE_LABELS } from "@/features/organizations/utils/roles";

import type { Membership } from "@/features/organizations/types/organization";

interface OrganizationCardProps {
  membership: Membership;
  memberCount: number;
}

export function OrganizationCard({
  membership,
  memberCount,
}: OrganizationCardProps) {
  const { organization, role } = membership;

  return (
    <section
      aria-labelledby="organization-title"
      className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        >
          <Building2 className="size-5" strokeWidth={1.75} />
        </span>
        <h2
          id="organization-title"
          className="min-w-0 truncate text-base font-semibold"
        >
          {organization.name}
        </h2>
      </div>

      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Your role</dt>
        <dd>{ROLE_LABELS[role]}</dd>
        <dt className="text-muted-foreground">Members</dt>
        <dd className="tabular">{memberCount}</dd>
        <dt className="text-muted-foreground">Timezone</dt>
        <dd className="truncate">
          {organization.timezone.replaceAll("_", " ")}
        </dd>
      </dl>
    </section>
  );
}
