import { describe, expect, it } from "vitest";

import {
  INVITATION_FAILURES,
  describeInvitationFailure,
} from "./invitationErrors";

import type { InvitationFailure } from "./invitationErrors";

describe("describeInvitationFailure", () => {
  const every: InvitationFailure[] = [...INVITATION_FAILURES, "unknown"];

  it.each(every)("never shows the database wording for %s", (failure) => {
    const message = describeInvitationFailure(failure);

    expect(message.length).toBeGreaterThan(0);
    expect(message).not.toMatch(/_/);
  });

  it("tells the person what to do next for an expired invitation", () => {
    expect(describeInvitationFailure("invitation_expired")).toBe(
      "This invitation has expired. Ask for a new one.",
    );
  });
});
