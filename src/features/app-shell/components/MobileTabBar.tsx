"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { NAV_ITEMS } from "../constants/navigation";

import type { NavItemId } from "../constants/navigation";

// Static class names so Tailwind generates them. The design has at most four tabs.
const GRID_COLUMNS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

interface MobileTabBarProps {
  orgSlug: string;
  items: readonly NavItemId[];
}

/** Bottom tabs on phones, in the thumb zone (docs/design-system.md §5). */
export function MobileTabBar({ orgSlug, items }: MobileTabBarProps) {
  const activeSegment = useSelectedLayoutSegment();

  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 z-20 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul
        className={`grid px-2 pt-2 pb-3 ${GRID_COLUMNS[items.length] ?? "grid-cols-4"}`}
      >
        {items.map((itemId) => {
          const item = NAV_ITEMS[itemId];
          const Icon = item.icon;
          const isActive = activeSegment === item.segment;

          return (
            <li key={itemId}>
              <Link
                href={item.href(orgSlug)}
                aria-current={isActive ? "page" : undefined}
                className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
              >
                <Icon
                  aria-hidden="true"
                  className={isActive ? "size-5 text-brand" : "size-5"}
                  strokeWidth={1.75}
                />
                {item.tabLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
