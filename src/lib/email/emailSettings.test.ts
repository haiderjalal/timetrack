import { describe, expect, it } from "vitest";

import { getEmailSettings } from "./emailSettings";

describe("getEmailSettings", () => {
  it("returns the key and sender when both are set", () => {
    expect(
      getEmailSettings({
        RESEND_API_KEY: "re_test",
        EMAIL_FROM: "TimeTrack <hello@example.com>",
      }),
    ).toEqual({ apiKey: "re_test", from: "TimeTrack <hello@example.com>" });
  });

  it("is null when the sender is missing or blank", () => {
    expect(getEmailSettings({ RESEND_API_KEY: "re_test" })).toBeNull();
    expect(
      getEmailSettings({ RESEND_API_KEY: "re_test", EMAIL_FROM: "   " }),
    ).toBeNull();
  });

  it("is null when the key is missing", () => {
    expect(getEmailSettings({ EMAIL_FROM: "hello@example.com" })).toBeNull();
  });
});
