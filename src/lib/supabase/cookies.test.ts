import { describe, expect, it } from "vitest";

import {
  AUTH_COOKIE_OPTIONS,
  hasAuthCookie,
  isAuthCookieName,
} from "./cookies";

describe("Supabase auth cookies", () => {
  it("recognizes session, chunked and PKCE verifier cookies", () => {
    expect(isAuthCookieName("sb-abcd1234-auth-token")).toBe(true);
    expect(isAuthCookieName("sb-abcd1234-auth-token.0")).toBe(true);
    expect(isAuthCookieName("sb-abcd1234-auth-token-code-verifier")).toBe(true);
  });

  it("ignores unrelated cookies", () => {
    expect(isAuthCookieName("tt_next")).toBe(false);
    expect(isAuthCookieName("sb-other")).toBe(false);
    expect(hasAuthCookie([{ name: "theme" }, { name: "tt_next" }])).toBe(false);
    expect(hasAuthCookie([{ name: "sb-x-auth-token" }])).toBe(true);
  });

  it("keeps tokens out of reach of page scripts", () => {
    expect(AUTH_COOKIE_OPTIONS).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  });
});
