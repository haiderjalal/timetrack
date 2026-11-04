import { LogOut } from "lucide-react";

import { SubmitButton } from "@/components/shared/SubmitButton";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ROUTES } from "@/constants/routes";

import { signOut } from "../actions/signOut";
import { requireUser } from "../services/currentUser";
import { GoogleIcon } from "./GoogleIcon";

export async function AccountCard() {
  const user = await requireUser(ROUTES.account);

  return (
    <section
      aria-labelledby="profile-title"
      className="flex flex-col gap-6 rounded-2xl border bg-card p-6 shadow-xs sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
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
      <span className="size-14 shrink-0 rounded-full bg-muted motion-safe:animate-pulse" />
      <span className="flex flex-1 flex-col gap-2">
        <span className="h-5 w-40 rounded-md bg-muted motion-safe:animate-pulse" />
        <span className="h-4 w-56 rounded-md bg-muted motion-safe:animate-pulse" />
      </span>
    </div>
  );
}
