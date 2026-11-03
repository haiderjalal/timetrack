import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ROUTES } from "@/constants/routes";
import { NEXT_PATH_COOKIE } from "@/features/auth/constants/auth";
import {
  getLoginPath,
  getSafeRedirectPath,
} from "@/features/auth/utils/redirects";
import { describeError, logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { AuthErrorCode } from "@/features/auth/constants/auth";
import type { NextRequest } from "next/server";

/** Google → Supabase → here: exchange the one-time code for a session. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const cookieStore = await cookies();

  const nextPath = getSafeRedirectPath(
    cookieStore.get(NEXT_PATH_COOKIE)?.value,
  );
  cookieStore.delete({ name: NEXT_PATH_COOKIE, path: ROUTES.authCallback });

  const providerError = searchParams.get("error");
  if (providerError) {
    // Untrusted query value: cap it so it can't flood the logs.
    logger.warn("auth.callback_provider_error", {
      error: providerError.slice(0, 64),
    });
    return redirectTo(
      request,
      getLoginPath({
        next: nextPath,
        error: providerError === "access_denied" ? "cancelled" : "callback",
      }),
    );
  }

  const code = searchParams.get("code");
  if (!code) {
    return redirectTo(
      request,
      getLoginPath({ next: nextPath, error: "callback" }),
    );
  }

  const failure = await exchangeCode(code);
  if (failure) {
    return redirectTo(
      request,
      getLoginPath({ next: nextPath, error: failure }),
    );
  }

  return redirectTo(request, nextPath);
}

async function exchangeCode(code: string): Promise<AuthErrorCode | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return null;

    logger.warn("auth.code_exchange_failed", { code: error.code ?? null });
    return "callback";
  } catch (error) {
    logger.error("auth.code_exchange_failed", { error: describeError(error) });
    return "unavailable";
  }
}

function redirectTo(request: NextRequest, path: string): NextResponse {
  // `path` is always a validated same-site path, so this can't leave the site.
  const response = NextResponse.redirect(new URL(path, request.url));
  // This response sets session cookies: no CDN or browser may cache it.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
