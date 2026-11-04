import { describe, expect, it } from "vitest";

import {
  INVITATION_TOKEN_PATTERN,
  MAX_INVITES_PER_REQUEST,
  inviteFormSchema,
  inviteMembersSchema,
  parseInviteEmails,
} from "./invitation.schema";

function tooMany(): string {
  return Array.from(
    { length: MAX_INVITES_PER_REQUEST + 1 },
    (_, index) => `person${index}@example.com`,
  ).join(" ");
}

describe("parseInviteEmails", () => {
  it("splits on commas, semicolons, spaces and line breaks", () => {
    expect(
      parseInviteEmails("a@x.com, b@x.com;c@x.com\nd@x.com  e@x.com").emails,
    ).toEqual(["a@x.com", "b@x.com", "c@x.com", "d@x.com", "e@x.com"]);
  });

  it("lowercases addresses and drops repeats, keeping the first order", () => {
    expect(parseInviteEmails("B@x.com a@x.com b@x.com").emails).toEqual([
      "b@x.com",
      "a@x.com",
    ]);
  });

  it("sets aside anything that isn't an address", () => {
    expect(parseInviteEmails("ok@x.com not-an-email")).toEqual({
      emails: ["ok@x.com"],
      invalid: ["not-an-email"],
    });
  });

  it("finds nothing in blank input", () => {
    expect(parseInviteEmails("  \n ")).toEqual({ emails: [], invalid: [] });
  });
});

describe("inviteFormSchema", () => {
  it("accepts valid addresses with a role", () => {
    expect(
      inviteFormSchema.safeParse({ emailsText: "a@x.com", role: "member" })
        .success,
    ).toBe(true);
  });

  it("names the addresses it can't read", () => {
    const result = inviteFormSchema.safeParse({
      emailsText: "ok@x.com bad-address",
      role: "member",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Check these addresses: bad-address",
    );
  });

  it("asks for at least one address", () => {
    const result = inviteFormSchema.safeParse({
      emailsText: " ",
      role: "member",
    });

    expect(result.error?.issues[0]?.message).toBe(
      "Add at least one email address.",
    );
  });

  it(`caps a request at ${MAX_INVITES_PER_REQUEST} addresses`, () => {
    const result = inviteFormSchema.safeParse({
      emailsText: tooMany(),
      role: "member",
    });

    expect(result.error?.issues[0]?.message).toBe(
      `Invite up to ${MAX_INVITES_PER_REQUEST} people at a time.`,
    );
  });

  it("never offers owner as a role", () => {
    expect(
      inviteFormSchema.safeParse({ emailsText: "a@x.com", role: "owner" })
        .success,
    ).toBe(false);
  });
});

describe("inviteMembersSchema", () => {
  it("checks the same rules on the server", () => {
    expect(
      inviteMembersSchema.safeParse({
        emails: ["not-an-email"],
        role: "member",
      }).success,
    ).toBe(false);
    expect(
      inviteMembersSchema.safeParse({ emails: [], role: "member" }).success,
    ).toBe(false);
    expect(
      inviteMembersSchema.safeParse({ emails: ["a@x.com"], role: "admin" })
        .success,
    ).toBe(true);
  });
});

describe("INVITATION_TOKEN_PATTERN", () => {
  it("matches 43 base64url characters and nothing else", () => {
    expect(INVITATION_TOKEN_PATTERN.test("a".repeat(43))).toBe(true);
    expect(INVITATION_TOKEN_PATTERN.test("a".repeat(42))).toBe(false);
    expect(INVITATION_TOKEN_PATTERN.test(`${"a".repeat(42)}+`)).toBe(false);
  });
});
