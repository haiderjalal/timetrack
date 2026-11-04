import { describe, expect, it } from "vitest";

import {
  canChangeRole,
  canDeactivate,
  canInviteAs,
  isInvitableRole,
} from "./roles";

describe("canInviteAs", () => {
  it.each([
    ["owner", "admin", true],
    ["owner", "member", true],
    ["admin", "member", true],
    ["admin", "admin", false],
    ["member", "member", false],
  ] as const)("%s inviting %s is %s", (actor, role, expected) => {
    expect(canInviteAs(actor, role)).toBe(expected);
  });
});

describe("canChangeRole", () => {
  it.each([
    ["owner", "admin", true],
    ["owner", "member", true],
    ["owner", "owner", false],
    ["admin", "member", false],
    ["member", "member", false],
  ] as const)("%s changing a %s is %s", (actor, target, expected) => {
    expect(canChangeRole(actor, target)).toBe(expected);
  });
});

describe("canDeactivate", () => {
  it.each([
    ["owner", "owner", true],
    ["owner", "admin", true],
    ["owner", "member", true],
    ["admin", "admin", false],
    ["admin", "member", true],
    ["member", "member", false],
  ] as const)("%s deactivating a %s is %s", (actor, target, expected) => {
    expect(canDeactivate(actor, target)).toBe(expected);
  });
});

describe("isInvitableRole", () => {
  it("allows admin and member, never owner", () => {
    expect(isInvitableRole("admin")).toBe(true);
    expect(isInvitableRole("member")).toBe(true);
    expect(isInvitableRole("owner")).toBe(false);
  });
});
