import { describe, expect, it } from "vitest";

import { formatDateInZone } from "./formatDateInZone";

describe("formatDateInZone", () => {
  it("formats the date in the org's timezone", () => {
    expect(formatDateInZone("2026-11-03T12:00:00Z", "Asia/Karachi")).toBe(
      "3 Nov 2026",
    );
  });

  it("moves a late-evening UTC instant to the next day when the org is ahead of UTC", () => {
    // 20:30 UTC is 01:30 on the 4th in Karachi (UTC+5).
    expect(formatDateInZone("2026-11-03T20:30:00Z", "Asia/Karachi")).toBe(
      "4 Nov 2026",
    );
  });
});
