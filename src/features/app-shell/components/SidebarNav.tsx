"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { NAV_ITEMS } from "../constants/navigation";

import type { NavGroup } from "../constants/navigation";

interface SidebarNavProps {
  orgSlug: string;
  groups: NavGroup[];
}

/** Desktop navigation. Labels collapse into an icon rail on tablets. */
export function SidebarNav({ orgSlug, groups }: SidebarNavProps) {
  const activeSegment = useSelectedLayoutSegment();

  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-0.5">
          <h2 className="px-2 pb-1.5 text-xs font-medium text-muted-foreground max-lg:sr-only">
            {group.label}
          </h2>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((itemId) => {
              const item = NAV_ITEMS[itemId];
              const Icon = item.icon;
              const isActive = activeSegment === item.segment;

              return (
                <li key={itemId}>
                  <Link
                    href={item.href(orgSlug)}
                    aria-current={isActive ? "page" : undefined}
                    title={item.label}
                    className="flex min-h-10 items-center gap-2.5 rounded-lg px-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground max-lg:justify-center"
                  >
                    <Icon
                      aria-hidden="true"
                      className={
                        isActive
                          ? "size-5 shrink-0 text-brand"
                          : "size-5 shrink-0"
                      }
                      strokeWidth={1.75}
                    />
                    <span className="max-lg:sr-only">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
