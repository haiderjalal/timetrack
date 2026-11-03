import { describe, expect, it } from "vitest";

import {
  firstParam,
  getAuthErrorMessage,
  getLoginPath,
  getSafeRedirectPath,
  isProtectedPath,
} from "./redirects";

describe("getSafeRedirectPath", () => {
  it.each([
    ["/account", "/account"],
    ["/o/acme/dashboard", "/o/acme/dashboard"],
    ["/o/acme/reports?month=2026-11#top", "/o/acme/reports?month=2026-11#top"],
  ])("keeps the same-site path %s", (input, expected) => {
    expect(getSafeRedirectPath(input)).toBe(expected);
  });

  it.each([
    ["protocol-relative URL", "//evil.example"],
    ["backslash trick", "/\\evil.example"],
    ["encoded backslash path", "/\\/evil.example"],
    ["absolute URL", "https://evil.example/account"],
    ["javascript URL", "javascript:alert(1)"],
    ["data URL", "data:text/html,hi"],
    ["relative path", "account"],
    ["tab injection", "/\t/evil.example"],
    ["newline injection", "/account\n"],
    ["empty string", ""],
    ["missing value", null],
    ["non-string value", 42],
  ])("rejects a %s", (_label, input) => {
    expect(getSafeRedirectPath(input)).toBe("/account");
  });

  it("never sends people back to the login page or the OAuth callback", () => {
    expect(getSafeRedirectPath("/login?next=/login")).toBe("/account");
    expect(getSafeRedirectPath("/auth/callback?code=x")).toBe("/account");
  });
});

describe("isProtectedPath", () => {
  it.each(["/account", "/onboarding", "/o/acme", "/o/acme/reports"])(
    "protects %s",
    (path) => {
      expect(isProtectedPath(path)).toBe(true);
    },
  );

  it.each(["/", "/login", "/auth/callback", "/organic", "/accounts"])(
    "leaves %s public",
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
    },
  );
});

describe("getAuthErrorMessage", () => {
  it("maps known codes to a friendly message", () => {
    expect(getAuthErrorMessage("cancelled")).toMatch(/cancelled/);
  });

  it("ignores unknown or attacker-supplied codes", () => {
    expect(getAuthErrorMessage("<script>")).toBeNull();
    expect(getAuthErrorMessage("toString")).toBeNull();
    expect(getAuthErrorMessage(undefined)).toBeNull();
  });
});

describe("getLoginPath", () => {
  it("encodes the return path and error", () => {
    expect(getLoginPath({ next: "/o/acme?tab=1", error: "callback" })).toBe(
      "/login?next=%2Fo%2Facme%3Ftab%3D1&error=callback",
    );
    expect(getLoginPath({})).toBe("/login");
  });
});

describe("firstParam", () => {
  it("takes the first of repeated params", () => {
    expect(firstParam(["/a", "/b"])).toBe("/a");
    expect(firstParam("/a")).toBe("/a");
    expect(firstParam(undefined)).toBeUndefined();
  });
});
