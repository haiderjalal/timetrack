import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSiteUrl } from "./getSiteUrl";

describe("getSiteUrl", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    vi.stubEnv("VERCEL_URL", undefined);
  });

  it("prefers the configured site URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://timetrack.example.com");
    vi.stubEnv("VERCEL_URL", "timetrack-git-feature.vercel.app");

    expect(getSiteUrl().origin).toBe("https://timetrack.example.com");
  });

  it("falls back to the Vercel deployment URL", () => {
    vi.stubEnv("VERCEL_URL", "timetrack-git-feature.vercel.app");

    expect(getSiteUrl().origin).toBe(
      "https://timetrack-git-feature.vercel.app",
    );
  });

  it("falls back to localhost for local development", () => {
    expect(getSiteUrl().origin).toBe("http://localhost:3000");
  });

  it("fails loudly on a malformed URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "timetrack.example.com");

    expect(() => getSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});
