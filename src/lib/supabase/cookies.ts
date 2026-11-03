import type { CookieOptions } from "@supabase/ssr";

/**
 * Session cookies are httpOnly: only server code talks to Supabase, so page
 * scripts never need the tokens, and an XSS bug can't read them.
 */
export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

/** Matches `sb-<project-ref>-auth-token`, its chunks (`.0`, `.1`) and the PKCE verifier. */
export function isAuthCookieName(name: string): boolean {
  return name.startsWith("sb-") && name.includes("-auth-token");
}

/** Lets signed-out requests skip Supabase entirely. */
export function hasAuthCookie(cookies: { name: string }[]): boolean {
  return cookies.some((cookie) => isAuthCookieName(cookie.name));
}
