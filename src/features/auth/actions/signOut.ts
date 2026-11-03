"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { describeError, logger } from "@/lib/logger";
import { isAuthCookieName } from "@/lib/supabase/cookies";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signOut(): Promise<never> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.warn("auth.sign_out_failed", { code: error.code ?? null });
    }
  } catch (error) {
    logger.error("auth.sign_out_failed", { error: describeError(error) });
  }

  // Whatever happened upstream, this browser must end up signed out.
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (isAuthCookieName(cookie.name)) cookieStore.delete(cookie.name);
  }

  redirect(ROUTES.home);
}
