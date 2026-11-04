import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { describeError, logger } from "@/lib/logger";

import { AUTH_COOKIE_OPTIONS, hasAuthCookie } from "./cookies";
import { getSupabaseEnv } from "./env";

import type { NextRequest } from "next/server";

interface SessionRefresh {
  /** Carries any refreshed session cookies; return it (or copy it) from proxy.ts. */
  response: NextResponse;
  isSignedIn: boolean;
}

const NO_STORE_HEADERS = ["cache-control", "expires", "pragma"] as const;

/** Refreshes the Supabase session cookies and reports whether the JWT is valid. */
export async function refreshSession(
  request: NextRequest,
): Promise<SessionRefresh> {
  let response = NextResponse.next({ request });

  // Anonymous visitors (most landing-page traffic) never touch Supabase.
  if (!hasAuthCookie(request.cookies.getAll())) {
    return { response, isSignedIn: false };
  }

  try {
    const { url, publishableKey } = getSupabaseEnv();
    const supabase = createServerClient(url, publishableKey, {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      global: { fetch: fetchWithTimeout },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          // Responses that set auth cookies must never be cached by a CDN.
          for (const [header, value] of Object.entries(headers)) {
            response.headers.set(header, value);
          }
        },
      },
    });

    // Nothing may run between creating the client and getClaims(): this call
    // refreshes an expired session, and skipping it signs users out at random.
    const { data } = await supabase.auth.getClaims();

    return { response, isSignedIn: Boolean(data?.claims) };
  } catch (error) {
    logger.error("auth.session_refresh_failed", {
      error: describeError(error),
    });
    return { response, isSignedIn: false };
  }
}

/** A redirect that keeps the refreshed session cookies and no-store headers. */
export function redirectWithSession(
  url: URL,
  session: NextResponse,
): NextResponse {
  const redirect = NextResponse.redirect(url);

  for (const cookie of session.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  for (const header of NO_STORE_HEADERS) {
    const value = session.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }

  return redirect;
}
