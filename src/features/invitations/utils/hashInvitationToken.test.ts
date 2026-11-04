import { describe, expect, it } from "vitest";

import { hashInvitationToken } from "./hashInvitationToken";

describe("hashInvitationToken", () => {
  // The database computes sha256(convert_to(token, 'UTF8')); this vector is the
  // standard SHA-256 of "abc", so both sides agree on the algorithm and encoding.
  it("is the SHA-256 of the token's UTF-8 bytes, as hex", () => {
    expect(hashInvitationToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("gives 64 hex characters, so it fits a 32-byte column", () => {
    expect(hashInvitationToken("any-token")).toMatch(/^[0-9a-f]{64}$/);
  });
});
