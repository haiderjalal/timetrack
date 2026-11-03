import { ROUTES } from "@/constants/routes";
import {
  getLoginPath,
  getSafeRedirectPath,
  isProtectedPath,
} from "@/features/auth/utils/redirects";
import { redirectWithSession, refreshSession } from "@/lib/supabase/proxy";

import type { NextRequest, NextResponse } from "next/server";

/**
 * Keeps the Supabase session fresh and does fast, optimistic routing.
 * This is not the security boundary: every protected page, Server Action and
 * Route Handler verifies the user again with requireUser().
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { response, isSignedIn } = await refreshSession(request);
  const { pathname, search, searchParams } = request.nextUrl;

  if (!isSignedIn && isProtectedPath(pathname)) {
    const loginUrl = new URL(
      getLoginPath({ next: `${pathname}${search}` }),
      request.url,
    );
    return redirectWithSession(loginUrl, response);
  }

  if (isSignedIn && pathname === ROUTES.login) {
    const destination = getSafeRedirectPath(searchParams.get("next"));
    return redirectWithSession(new URL(destination, request.url), response);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets, image optimization, metadata files and
    // the health check, which must answer even if auth is down.
    "/((?!_next/static|_next/image|api/health|icon.svg|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
