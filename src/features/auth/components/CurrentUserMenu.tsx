import { UserMenu } from "@/components/layout/UserMenu";

import { requireUser } from "../services/currentUser";

interface CurrentUserMenuProps {
  /** Where to come back to if the session has expired. */
  returnTo: string;
}

/** The user menu for pages outside an org. Reads the session, so render it inside Suspense. */
export async function CurrentUserMenu({ returnTo }: CurrentUserMenuProps) {
  const user = await requireUser(returnTo);
  return (
    <UserMenu name={user.name} email={user.email} avatarUrl={user.avatarUrl} />
  );
}
