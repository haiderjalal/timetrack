import { redirect } from "next/navigation";
import { Suspense } from "react";

import { orgDashboardPath } from "@/constants/routes";
import { InviteMembersDialog } from "@/features/invitations/components/InviteMembersDialog";
import { PendingInvitationsCard } from "@/features/invitations/components/PendingInvitationsCard";
import { listPendingInvitations } from "@/features/invitations/services/listPendingInvitations";
import { TeamMembersTable } from "@/features/members/components/TeamMembersTable";
import { listTeamMembersForOrg } from "@/features/members/services/listTeamMembers";
import { requireMembership } from "@/features/organizations/services/membership";
import { canManageOrganization } from "@/features/organizations/utils/roles";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false },
};

/** Who is on the team, and the invitations still waiting. Owners and admins only. */
export default function TeamPage({ params }: PageProps<"/o/[orgSlug]/team">) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <Suspense fallback={<TeamSkeleton />}>
        <TeamOverview params={params} />
      </Suspense>
    </div>
  );
}

async function TeamOverview({
  params,
}: Pick<PageProps<"/o/[orgSlug]/team">, "params">) {
  const { orgSlug } = await params;
  const { user, membership } = await requireMembership(orgSlug);

  // Members don't manage the team, so they go to their dashboard instead.
  if (!canManageOrganization(membership.role))
    redirect(orgDashboardPath(orgSlug));

  const { organization } = membership;
  const [members, invitations] = await Promise.all([
    listTeamMembersForOrg(organization.id),
    listPendingInvitations(organization.id),
  ]);

  const activeCount = members.filter(
    (member) => member.status === "active",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {activeCount} {activeCount === 1 ? "person" : "people"} on the team
        </p>
        <InviteMembersDialog orgSlug={orgSlug} actorRole={membership.role} />
      </div>

      <TeamMembersTable
        orgSlug={orgSlug}
        actorUserId={user.id}
        actorRole={membership.role}
        members={members}
        timeZone={organization.timezone}
      />

      <PendingInvitationsCard
        orgSlug={orgSlug}
        timeZone={organization.timezone}
        invitations={invitations}
      />
    </div>
  );
}

function TeamSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <span className="ml-auto block h-10 w-40 rounded-lg bg-muted motion-safe:animate-pulse" />
      <span className="h-80 rounded-xl border bg-card motion-safe:animate-pulse" />
      <span className="h-40 rounded-xl border bg-card motion-safe:animate-pulse" />
    </div>
  );
}
