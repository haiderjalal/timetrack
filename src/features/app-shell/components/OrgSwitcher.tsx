"use client";

import Link from "next/link";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { LogoMark } from "@/components/shared/LogoMark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES, orgDashboardPath } from "@/constants/routes";

export interface OrgSwitcherOption {
  name: string;
  slug: string;
  roleLabel: string;
}

interface OrgSwitcherProps {
  current: OrgSwitcherOption;
  organizations: OrgSwitcherOption[];
  /** "sidebar": full card (rail-sized on tablets). "compact": name only, for the phone top bar. */
  variant: "sidebar" | "compact";
}

/** Switch between your orgs, or create a new one (business-rules.md §1, Q10). */
export function OrgSwitcher({
  current,
  organizations,
  variant,
}: OrgSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Organization: ${current.name}. Switch organization`}
        className={
          variant === "sidebar"
            ? "flex w-full items-center gap-2.5 rounded-xl border bg-background p-2 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-expanded:bg-muted max-lg:justify-center max-lg:border-transparent max-lg:p-1"
            : "flex min-h-11 min-w-0 items-center gap-1.5 rounded-lg px-1 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        }
      >
        {variant === "sidebar" ? (
          <>
            <LogoMark />
            <span className="flex min-w-0 flex-1 flex-col max-lg:sr-only">
              <span className="truncate text-sm font-semibold">
                {current.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {current.roleLabel}
              </span>
            </span>
            <ChevronsUpDown
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground max-lg:hidden"
            />
          </>
        ) : (
          <>
            <span className="truncate">{current.name}</span>
            <ChevronsUpDown
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        {organizations.map((organization) => {
          const isCurrent = organization.slug === current.slug;
          return (
            <DropdownMenuItem key={organization.slug} asChild>
              <Link
                href={orgDashboardPath(organization.slug)}
                aria-current={isCurrent ? "page" : undefined}
                className="min-h-10"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">
                    {organization.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {organization.roleLabel}
                  </span>
                </span>
                {isCurrent ? (
                  <Check
                    aria-label="Current organization"
                    className="text-brand"
                  />
                ) : null}
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ROUTES.onboarding} className="min-h-10">
            <Plus aria-hidden="true" />
            Create organization
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
