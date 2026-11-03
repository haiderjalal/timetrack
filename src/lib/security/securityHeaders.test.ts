import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  getSecurityHeaders,
} from "./securityHeaders";

const SUPABASE_URL = "https://abcd1234.supabase.co";

function directive(policy: string, name: string): string | undefined {
  return policy.split("; ").find((entry) => entry.startsWith(`${name} `));
}

describe("buildContentSecurityPolicy", () => {
  it("allows the Supabase API and its realtime socket", () => {
    const policy = buildContentSecurityPolicy({
      isDevelopment: false,
      supabaseUrl: SUPABASE_URL,
    });

    expect(directive(policy, "connect-src")).toBe(
      "connect-src 'self' https://abcd1234.supabase.co wss://abcd1234.supabase.co",
    );
  });

  it("lets the Google sign-in redirect chain pass form-action", () => {
    const policy = buildContentSecurityPolicy({
      isDevelopment: false,
      supabaseUrl: SUPABASE_URL,
    });

    expect(directive(policy, "form-action")).toBe(
      "form-action 'self' https://abcd1234.supabase.co https://accounts.google.com",
    );
  });

  it("is strict in production: no eval, no framing, HTTPS upgrade", () => {
    const policy = buildContentSecurityPolicy({ isDevelopment: false });

    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("upgrade-insecure-requests");
  });

  it("relaxes only what local development needs", () => {
    const policy = buildContentSecurityPolicy({ isDevelopment: true });

    expect(directive(policy, "script-src")).toContain("'unsafe-eval'");
    expect(directive(policy, "connect-src")).toContain("ws:");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });

  it("works before Supabase is configured", () => {
    const policy = buildContentSecurityPolicy({ isDevelopment: false });

    expect(directive(policy, "connect-src")).toBe("connect-src 'self'");
  });

  it("rejects a malformed Supabase URL instead of silently dropping it", () => {
    expect(() =>
      buildContentSecurityPolicy({
        isDevelopment: false,
        supabaseUrl: "not a url",
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});

describe("getSecurityHeaders", () => {
  it("sends the full set of hardening headers", () => {
    const keys = getSecurityHeaders({ isDevelopment: false }).map(
      (header) => header.key,
    );

    expect(keys).toEqual([
      "Content-Security-Policy",
      "Strict-Transport-Security",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Cross-Origin-Opener-Policy",
      "Permissions-Policy",
    ]);
  });
});
