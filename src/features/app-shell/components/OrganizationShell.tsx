import { after } from "next/server";
import { Suspense } from "react";

import { UserMenu } from "@/components/layout/UserMenu";
import { LogoMark } from "@/components/shared/LogoMark";
import { rememberLastOrganization } from "@/features/organizations/repositories/organizationRepository";
import { requireMembership } from "@/features/organizations/services/membership";
import { ROLE_LABELS } from "@/features/organizations/utils/roles";
import { CurrentClockChip } from "@/features/time-tracking/components/CurrentClockChip";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCalendarDate } from "@/lib/time/formatDate";
import { getZonedNow } from "@/lib/time/zonedNow";

import { getNavGroups, MIN_TABS } from "../utils/navigation";
import { MobileTabBar } from "./MobileTabBar";
import { OrgSwitcher } from "./OrgSwitcher";
import { PageTitle } from "./PageTitle";
import { SidebarNav } from "./SidebarNav";

import type { OrgSwitcherOption } from "./OrgSwitcher";
import type { Membership } from "@/features/organizations/types/organization";

// Each piece below reads the session and streams in behind its own Suspense
// boundary in the org layout. requireMembership() is cached per request, so
// they share one membership query.

interface ShellPartProps {
  params: Promise<{ orgSlug: string }>;
}

export async function OrganizationSidebar({ params }: ShellPartProps) {
  const { orgSlug } = await params;
  const { membership, memberships } = await requireMembership(orgSlug);

  return (
    <div className="flex flex-col gap-6">
      <OrgSwitcher
        variant="sidebar"
        current={toOption(membership)}
        organizations={memberships.map(toOption)}
      />
      <SidebarNav
        orgSlug={membership.organization.slug}
        groups={getNavGroups(membership.role)}
      />
    </div>
  );
}

export async function OrganizationTopBar({ params }: ShellPartProps) {
  const { orgSlug } = await params;
  const { user, membership, memberships } = await requireMembership(orgSlug);
  const today = getZonedNow(membership.organization.timezone);

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
        <LogoMark />
        <OrgSwitcher
          variant="compact"
          current={toOption(membership)}
          organizations={memberships.map(toOption)}
        />
      </div>
      <div className="min-w-0 md:flex-1">
        <PageTitle />
      </div>
      <p className="text-sm text-muted-foreground tabular max-md:sr-only">
        <time dateTime={today.isoDate}>
          {formatCalendarDate(today.isoDate)}
        </time>
      </p>
      <Suspense fallback={null}>
        <CurrentClockChip
          orgId={membership.organization.id}
          orgSlug={membership.organization.slug}
          userId={user.id}
          timeZone={membership.organization.timezone}
        />
      </Suspense>
      <UserMenu
        name={user.name}
        email={user.email}
        avatarUrl={user.avatarUrl}
      />
    </>
  );
}

export async function OrganizationTabBar({ params }: ShellPartProps) {
  const { orgSlug } = await params;
  const { membership } = await requireMembership(orgSlug);
  // Phone tabs are the "Me" pages; managers will reach "Manage" from a sheet.
  const items =
    getNavGroups(membership.role).find((group) => group.id === "me")?.items ??
    [];

  if (items.length < MIN_TABS) return null;
  return <MobileTabBar orgSlug={membership.organization.slug} items={items} />;
}

/** Saves this org as the one to open after the next sign-in, once the page is sent. */
export async function RememberLastOrganization({ params }: ShellPartProps) {
  const { orgSlug } = await params;
  const { user, membership } = await requireMembership(orgSlug);
  // Request data can't be read inside after(), so create the client now.
  const supabase = await createSupabaseServerClient();

  after(async () => {
    try {
      await rememberLastOrganization(
        supabase,
        user.id,
        membership.organization.id,
      );
    } catch {
      // Logged by the repository. Landing on another org next time is harmless.
    }
  });

  return null;
}

function toOption({ organization, role }: Membership): OrgSwitcherOption {
  return {
    name: organization.name,
    slug: organization.slug,
    roleLabel: ROLE_LABELS[role],
  };
}
