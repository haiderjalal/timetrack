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

/** The team page of one org, for owners and admins. */
export function orgTeamPath(orgSlug: string): Route {
  return `/o/${encodeURIComponent(orgSlug)}/team` as Route;
}

/** The page that accepts an invitation. Tokens are URL-safe, so encoding changes nothing. */
export function invitePath(token: string): Route {
  return `/invite/${encodeURIComponent(token)}` as Route;
}
