import { describe, expect, it } from "vitest";

import { sortTeamMembers } from "./sortTeamMembers";

import type { TeamMember } from "../types/member";

function person(
  name: string,
  role: TeamMember["role"],
  status: TeamMember["status"] = "active",
): TeamMember {
  return {
    userId: name,
    name,
    email: `${name.toLowerCase()}@example.com`,
    avatarUrl: null,
    role,
    status,
    joinedAt: "2026-11-01T00:00:00Z",
  };
}

describe("sortTeamMembers", () => {
  it("lists active owners, admins and members, then deactivated people", () => {
    const sorted = sortTeamMembers([
      person("Zed", "member", "deactivated"),
      person("Mia", "member"),
      person("Ali", "admin"),
      person("Owen", "owner"),
    ]);

    expect(sorted.map((member) => member.name)).toEqual([
      "Owen",
      "Ali",
      "Mia",
      "Zed",
    ]);
  });

  it("orders people with the same role by name", () => {
    const sorted = sortTeamMembers([
      person("Sara", "member"),
      person("Hana", "member"),
    ]);

    expect(sorted.map((member) => member.name)).toEqual(["Hana", "Sara"]);
  });

  it("leaves the list it was given untouched", () => {
    const members = [person("Sara", "member"), person("Ali", "admin")];
    sortTeamMembers(members);

    expect(members.map((member) => member.name)).toEqual(["Sara", "Ali"]);
  });
});
