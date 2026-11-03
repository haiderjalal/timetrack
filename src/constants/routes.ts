import type { Route } from "next";

export const ROUTES = {
  home: "/",
  login: "/login",
  authCallback: "/auth/callback",
  account: "/account",
  onboarding: "/onboarding",
  /** Sends a signed-in person to their last org's dashboard, or to onboarding. */
  dashboard: "/dashboard",
} as const;

/** The dashboard of one org. typedRoutes needs the cast for a runtime slug. */
export function orgDashboardPath(orgSlug: string): Route {
  return `/o/${encodeURIComponent(orgSlug)}/dashboard` as Route;
}
