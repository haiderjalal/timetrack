import { describe, expect, it } from "vitest";

import { isInvitationExpired } from "./isInvitationExpired";

describe("isInvitationExpired", () => {
  const now = new Date("2026-11-04T12:00:00Z");

  it("is false while the link still works", () => {
    expect(isInvitationExpired("2026-11-11T12:00:00Z", now)).toBe(false);
  });

  it("is true once the expiry instant has passed", () => {
    expect(isInvitationExpired("2026-11-04T11:59:59Z", now)).toBe(true);
  });

  it("is true at the exact expiry instant, matching the database's check", () => {
    expect(isInvitationExpired("2026-11-04T12:00:00Z", now)).toBe(true);
  });
});
