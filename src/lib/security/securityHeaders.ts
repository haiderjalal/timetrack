interface SecurityHeaderOptions {
  isDevelopment: boolean;
  /** NEXT_PUBLIC_SUPABASE_URL; optional until Supabase is wired up. */
  supabaseUrl?: string;
}

interface Header {
  key: string;
  value: string;
}

const GOOGLE_ACCOUNTS_ORIGIN = "https://accounts.google.com";
const TWO_YEARS_IN_SECONDS = 63_072_000;

/**
 * Header-based CSP without nonces: nonces force every page to render dynamically,
 * which would throw away the prerendered static shell. See docs/architecture.md §8.
 */
export function buildContentSecurityPolicy({
  isDevelopment,
  supabaseUrl,
}: SecurityHeaderOptions): string {
  const supabaseOrigin = toOrigin(supabaseUrl);
  const supabaseSocketOrigin = supabaseOrigin?.replace(/^http/, "ws");

  const directives: Record<string, (string | undefined)[]> = {
    "default-src": ["'self'"],
    // Next.js bootstraps with inline scripts; React dev tooling needs eval.
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      isDevelopment ? "'unsafe-eval'" : undefined,
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": [
      "'self'",
      supabaseOrigin,
      supabaseSocketOrigin,
      isDevelopment ? "ws:" : undefined,
    ],
    // Google sign-in is a Server Action that redirects to Supabase and then Google;
    // browsers apply form-action to every hop of that redirect chain.
    "form-action": ["'self'", supabaseOrigin, GOOGLE_ACCOUNTS_ORIGIN],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
  };

  const policy = Object.entries(directives).map(
    ([directive, sources]) =>
      `${directive} ${sources.filter(isDefined).join(" ")}`,
  );

  if (!isDevelopment) {
    policy.push("upgrade-insecure-requests");
  }

  return policy.join("; ");
}

export function getSecurityHeaders(options: SecurityHeaderOptions): Header[] {
  return [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(options),
    },
    {
      key: "Strict-Transport-Security",
      value: `max-age=${TWO_YEARS_IN_SECONDS}; includeSubDomains; preload`,
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
  ];
}

function toOrigin(url: string | undefined): string | undefined {
  if (!url) return undefined;

  try {
    return new URL(url).origin;
  } catch {
    throw new Error(
      `Invalid Supabase URL "${url}". Check NEXT_PUBLIC_SUPABASE_URL.`,
    );
  }
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
