import { ROUTES } from "@/constants/routes";

import {
  AUTH_ERROR_MESSAGES,
  DEFAULT_SIGNED_IN_PATH,
  PROTECTED_PATH_PREFIXES,
} from "../constants/auth";

import type { AuthErrorCode } from "../constants/auth";
import type { Route } from "next";

// Any origin works: it only has to be one an attacker can't make us leave.
const PLACEHOLDER_ORIGIN = "http://placeholder.invalid";
const NEVER_RETURN_TO: string[] = [ROUTES.login, ROUTES.authCallback];

/**
 * Turns an untrusted `next` value into a same-site path, so sign-in can never
 * become an open redirect (`//evil.com`, `/\evil.com`, `https://…`, `javascript:`).
 */
export function getSafeRedirectPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/")) {
    return DEFAULT_SIGNED_IN_PATH;
  }

  // Browsers treat "\" like "/", and control characters can split URLs.
  if (next.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(next)) {
    return DEFAULT_SIGNED_IN_PATH;
  }

  let url: URL;
  try {
    url = new URL(next, PLACEHOLDER_ORIGIN);
  } catch {
    return DEFAULT_SIGNED_IN_PATH;
  }

  if (
    url.origin !== PLACEHOLDER_ORIGIN ||
    NEVER_RETURN_TO.includes(url.pathname)
  ) {
    return DEFAULT_SIGNED_IN_PATH;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getAuthErrorMessage(code: unknown): string | null {
  // hasOwn, not `in`: "toString" and other prototype keys must not match.
  return typeof code === "string" && Object.hasOwn(AUTH_ERROR_MESSAGES, code)
    ? AUTH_ERROR_MESSAGES[code as AuthErrorCode]
    : null;
}

export function getLoginPath(options: {
  next?: string;
  error?: AuthErrorCode;
}): Route {
  const params = new URLSearchParams();
  if (options.next) params.set("next", options.next);
  if (options.error) params.set("error", options.error);

  const query = params.toString();
  return query ? `${ROUTES.login}?${query}` : ROUTES.login;
}

/** Search params can repeat (`?next=a&next=b`); only the first value counts. */
export function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
