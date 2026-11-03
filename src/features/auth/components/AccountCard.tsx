import Image from "next/image";
import { LogOut } from "lucide-react";

import { SubmitButton } from "@/components/shared/SubmitButton";
import { ROUTES } from "@/constants/routes";

import { signOut } from "../actions/signOut";
import { requireUser } from "../services/currentUser";
import { GoogleIcon } from "./GoogleIcon";

const AVATAR_SIZE = 56;

export async function AccountCard() {
  const user = await requireUser(ROUTES.account);

  return (
    <section
      aria-labelledby="profile-title"
      className="flex flex-col gap-6 rounded-2xl border bg-card p-6 shadow-xs sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt=""
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            className="size-14 shrink-0 rounded-full"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground"
          >
            {getInitials(user.name)}
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id="profile-title" className="truncate text-lg font-semibold">
            {user.name}
          </h2>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <GoogleIcon />
            Signed in with Google
          </p>
        </div>
      </div>

      <form action={signOut}>
        <SubmitButton
          variant="outline"
          icon={<LogOut aria-hidden="true" />}
          pendingLabel="Signing out…"
        >
          Sign out
        </SubmitButton>
      </form>
    </section>
  );
}

export function AccountCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-4 rounded-2xl border bg-card p-6 shadow-xs"
    >
      <span className="size-14 shrink-0 animate-pulse rounded-full bg-muted" />
      <span className="flex flex-1 flex-col gap-2">
        <span className="h-5 w-40 animate-pulse rounded-md bg-muted" />
        <span className="h-4 w-56 animate-pulse rounded-md bg-muted" />
      </span>
    </div>
  );
}

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}
