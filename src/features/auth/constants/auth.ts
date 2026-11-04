import { ROUTES } from "@/constants/routes";

/**
 * Where a signed-in user lands when no (safe) destination was requested:
 * a resolver that picks their last org's dashboard, or onboarding.
 */
export const DEFAULT_SIGNED_IN_PATH = ROUTES.dashboard;

/** Remembers the page to return to across the Google round trip. */
export const NEXT_PATH_COOKIE = "tt_next";
export const NEXT_PATH_COOKIE_MAX_AGE_SECONDS = 10 * 60;

/** Pages that require a signed-in user. Checked in proxy.ts and again on the page. */
export const PROTECTED_PATH_PREFIXES = [
  ROUTES.account,
  ROUTES.dashboard,
  ROUTES.onboarding,
  "/o",
] as const;

export const AUTH_ERROR_MESSAGES = {
  cancelled: "Google sign-in was cancelled. Try again when you're ready.",
  callback: "We couldn't finish signing you in. Please try again.",
  unavailable:
    "Sign-in isn't available right now. Please try again in a few minutes.",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERROR_MESSAGES;
