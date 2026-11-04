import { NextResponse, connection } from "next/server";

import { ROUTES } from "@/constants/routes";
import { getCurrentUser } from "@/features/auth/services/currentUser";
import { getLoginPath } from "@/features/auth/utils/redirects";
import { resolveLandingPath } from "@/features/organizations/services/landing";
import { logger } from "@/lib/logger";

import type { NextRequest } from "next/server";

/**
 * The default destination after sign-in: the last org's dashboard, or
 * onboarding for someone who isn't in an org yet.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  await connection();

  const user = await getCurrentUser();
  if (!user) {
    return redirectTo(request, getLoginPath({ next: ROUTES.dashboard }));
  }

  try {
    return redirectTo(request, await resolveLandingPath(user.id));
  } catch {
    // Already logged by the repository. The account page works without org
    // data, so people are never stuck on an error after signing in.
    logger.warn("auth.landing_fallback", { destination: ROUTES.account });
    return redirectTo(request, ROUTES.account);
  }
}

function redirectTo(request: NextRequest, path: string): NextResponse {
  // `path` is always one of our own routes.
  const response = NextResponse.redirect(new URL(path, request.url));
  // Depends on who is signed in: never cache it anywhere.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
