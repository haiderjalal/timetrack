import { Suspense } from "react";

import {
  SidebarSkeleton,
  TopBarSkeleton,
} from "@/features/app-shell/components/AppShellSkeletons";
import {
  OrganizationSidebar,
  OrganizationTabBar,
  OrganizationTopBar,
  RememberLastOrganization,
} from "@/features/app-shell/components/OrganizationShell";

import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false },
};

/**
 * The app shell for one org (docs/design-system.md §5): sidebar on desktop (an
 * icon rail on tablets), top bar with the org switcher and user menu, and tabs
 * on phones. The frame is static; everything that depends on who is signed in
 * streams into it. Each part checks membership itself.
 */
export default function OrganizationLayout({
  children,
  params,
}: LayoutProps<"/o/[orgSlug]">) {
  return (
    <div className="flex flex-1 bg-canvas">
      <div className="sticky top-0 hidden h-dvh shrink-0 flex-col overflow-y-auto border-r bg-background px-3 py-4 md:flex md:w-16 lg:w-62">
        <Suspense fallback={<SidebarSkeleton />}>
          <OrganizationSidebar params={params} />
        </Suspense>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background px-4 md:px-6 lg:px-8">
          <Suspense fallback={<TopBarSkeleton />}>
            <OrganizationTopBar params={params} />
          </Suspense>
        </header>

        <main className="flex flex-1 flex-col">{children}</main>

        <Suspense fallback={null}>
          <OrganizationTabBar params={params} />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <RememberLastOrganization params={params} />
      </Suspense>
    </div>
  );
}
