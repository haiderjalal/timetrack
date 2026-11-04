import { describe, expect, it } from "vitest";

import {
  describeCreateOrganizationFailure,
  toCreateOrganizationFailure,
} from "./createOrganizationErrors";
import { pickLandingOrganization } from "./landing";
import { canManageOrganization } from "./roles";

import type { Membership, OrganizationRole } from "../types/organization";

function membership(id: string, role: OrganizationRole = "member"): Membership {
  return {
    role,
    organization: {
      id,
      name: `Org ${id}`,
      slug: `org-${id}`,
      timezone: "Asia/Karachi",
      weekStartsOn: 1,
    },
  };
}

describe("pickLandingOrganization", () => {
  const memberships = [membership("a"), membership("b")];

  it("opens the org used last", () => {
    expect(pickLandingOrganization(memberships, "b")?.slug).toBe("org-b");
  });

  it("falls back to the first org joined", () => {
    expect(pickLandingOrganization(memberships, null)?.slug).toBe("org-a");
  });

  it("ignores a last org the person has left", () => {
    expect(pickLandingOrganization(memberships, "gone")?.slug).toBe("org-a");
  });

  it("returns nothing for someone without an org (onboarding)", () => {
    expect(pickLandingOrganization([], "a")).toBeNull();
  });
});

describe("canManageOrganization", () => {
  it.each([
    ["owner", true],
    ["admin", true],
    ["member", false],
  ] as const)("%s → %s", (role, expected) => {
    expect(canManageOrganization(role)).toBe(expected);
  });
});

describe("create_organization errors", () => {
  it.each([
    ["slug_taken", "slug_taken"],
    ["invalid_timezone", "invalid_timezone"],
    ["invalid_input", "invalid_input"],
    ["invalid_schedule", "invalid_input"],
    ["not_authenticated", "unknown"],
    ['relation "organizations" does not exist', "unknown"],
    [undefined, "unknown"],
  ] as const)("maps %j to %s", (message, expected) => {
    expect(toCreateOrganizationFailure(message)).toBe(expected);
  });

  it("points a taken URL at the slug field", () => {
    expect(describeCreateOrganizationFailure("slug_taken").errors).toEqual([
      { field: "slug", message: "That URL is already taken. Try another one." },
    ]);
  });

  it("never shows database wording", () => {
    expect(describeCreateOrganizationFailure("unknown").message).toBe(
      "We couldn't create your organization. Please try again.",
    );
  });
});
