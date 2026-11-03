"use client";

import Link from "next/link";
import { useTransition } from "react";
import { CircleUser, LoaderCircle, LogOut } from "lucide-react";

import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { signOut } from "@/features/auth/actions/signOut";

interface UserMenuProps {
  name: string;
  email: string;
  avatarUrl: string | null;
}

/** The signed-in person's menu: their account page and sign out. */
export function UserMenu({ name, email, avatarUrl }: UserMenuProps) {
  const [isSigningOut, startSignOut] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${name}`}
        className="flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {isSigningOut ? (
          <LoaderCircle
            aria-hidden="true"
            className="size-5 opacity-60 motion-safe:animate-spin motion-safe:opacity-100"
          />
        ) : (
          <UserAvatar name={name} avatarUrl={avatarUrl} size="sm" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="truncate text-sm font-medium text-foreground">
            {name}
          </span>
          <span className="truncate">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ROUTES.account} className="min-h-10">
            <CircleUser aria-hidden="true" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-10"
          disabled={isSigningOut}
          onSelect={() => startSignOut(() => signOut())}
        >
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
