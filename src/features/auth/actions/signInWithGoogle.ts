"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { getSiteUrl } from "@/lib/getSiteUrl";
import { describeError, logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  NEXT_PATH_COOKIE,
  NEXT_PATH_COOKIE_MAX_AGE_SECONDS,
} from "../constants/auth";
import { getLoginPath, getSafeRedirectPath } from "../utils/redirects";

import type { Route } from "next";

/**
 * Starts Google OAuth (PKCE). The page to return to travels in a short-lived
 * httpOnly cookie, so the redirect URL registered in Supabase stays exact.
 */
export async function signInWithGoogle(formData: FormData): Promise<never> {
  const nextPath = getSafeRedirectPath(formData.get("next"));
  const oauthUrl = await getGoogleOAuthUrl();

  if (!oauthUrl) {
    redirect(getLoginPath({ next: nextPath, error: "unavailable" }));
  }

  const cookieStore = await cookies();
  cookieStore.set(NEXT_PATH_COOKIE, nextPath, {
    path: ROUTES.authCallback,
    maxAge: NEXT_PATH_COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // Google's consent page: an absolute URL from Supabase, not one of our routes.
  redirect(oauthUrl as Route);
}

async function getGoogleOAuthUrl(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: new URL(ROUTES.authCallback, getSiteUrl()).toString(),
        // Let people with several Google accounts pick the right one.
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      logger.error("auth.oauth_start_failed", { code: error.code ?? null });
      return null;
    }
    return data.url;
  } catch (error) {
    logger.error("auth.oauth_start_failed", { error: describeError(error) });
    return null;
  }
}
