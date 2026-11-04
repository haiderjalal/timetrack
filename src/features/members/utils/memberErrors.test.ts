import { describe, expect, it } from "vitest";

import { MEMBER_FAILURES, describeMemberFailure } from "./memberErrors";

import type { MemberFailure } from "./memberErrors";

describe("describeMemberFailure", () => {
  const every: MemberFailure[] = [...MEMBER_FAILURES, "unknown"];

  it.each(every)("never shows the database wording for %s", (failure) => {
    const message = describeMemberFailure(failure);

    expect(message.length).toBeGreaterThan(0);
    expect(message).not.toMatch(/_/);
  });
});
