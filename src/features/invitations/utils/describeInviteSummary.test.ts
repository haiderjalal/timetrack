import { describe, expect, it } from "vitest";

import { describeInviteSummary } from "./describeInviteSummary";

const none: string[] = [];

describe("describeInviteSummary", () => {
  it("counts sent invitations", () => {
    expect(
      describeInviteSummary({
        invited: ["a@x.com"],
        alreadyMembers: none,
        failed: none,
      }),
    ).toBe("Sent 1 invitation.");
    expect(
      describeInviteSummary({
        invited: ["a@x.com", "b@x.com"],
        alreadyMembers: none,
        failed: none,
      }),
    ).toBe("Sent 2 invitations.");
  });

  it("explains people who are already on the team", () => {
    expect(
      describeInviteSummary({
        invited: ["a@x.com", "b@x.com"],
        alreadyMembers: ["c@x.com"],
        failed: none,
      }),
    ).toBe("Sent 2 invitations. 1 is already on the team.");
    expect(
      describeInviteSummary({
        invited: none,
        alreadyMembers: ["c@x.com", "d@x.com"],
        failed: none,
      }),
    ).toBe("2 are already on the team.");
  });

  it("says which addresses couldn't be sent, and what to do", () => {
    expect(
      describeInviteSummary({
        invited: none,
        alreadyMembers: none,
        failed: ["a@x.com"],
      }),
    ).toBe(
      "1 address couldn't be sent. Press Resend on the pending list to try again.",
    );
  });

  it("reports a partial send in one line", () => {
    expect(
      describeInviteSummary({
        invited: ["a@x.com"],
        alreadyMembers: none,
        failed: ["b@x.com"],
      }),
    ).toBe(
      "Sent 1 invitation. 1 address couldn't be sent. Press Resend on the pending list to try again.",
    );
  });

  it("says so when there was nothing to send", () => {
    expect(
      describeInviteSummary({
        invited: none,
        alreadyMembers: none,
        failed: none,
      }),
    ).toBe("Nothing to send.");
  });
});
