import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { describeError, logger } from "@/lib/logger";
import { hasAuthCookie } from "@/lib/supabase/cookies";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getLoginPath } from "../utils/redirects";
import { toCurrentUser } from "../utils/toCurrentUser";

import type { CurrentUser } from "../types/currentUser";

/**
 * The verified signed-in user, or null. getClaims() checks the JWT signature
 * (never trust getSession() on the server). Cached for the current request only.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  if (!hasAuthCookie(cookieStore.getAll())) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) return null;
    return toCurrentUser(data.claims);
  } catch (error) {
    logger.error("auth.get_current_user_failed", {
      error: describeError(error),
    });
    return null;
  }
});

/** Use at the top of every protected page, Server Action and Route Handler. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(getLoginPath({ next: returnTo }));
  return user;
}
