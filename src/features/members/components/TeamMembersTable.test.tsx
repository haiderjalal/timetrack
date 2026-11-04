import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TeamMembersTable } from "./TeamMembersTable";

import type { OrganizationRole } from "@/features/organizations/types/organization";
import type { TeamMember } from "../types/member";

// The server actions need the database; the table only decides what to show.
vi.mock("../actions/changeMemberRole", () => ({
  changeMemberRole: vi.fn(),
}));
vi.mock("../actions/deactivateMember", () => ({
  deactivateMember: vi.fn(),
}));

function person(
  name: string,
  userId: string,
  role: OrganizationRole,
): TeamMember {
  return {
    userId,
    name,
    email: `${name.toLowerCase()}@example.com`,
    avatarUrl: null,
    role,
    status: "active",
    joinedAt: "2026-11-01T00:00:00Z",
  };
}

const team = [
  person("Owen", "owner-id", "owner"),
  person("Ali", "admin-id", "admin"),
  person("Sam", "other-admin-id", "admin"),
  person("Mia", "member-id", "member"),
];

function renderAs(actorUserId: string, actorRole: OrganizationRole) {
  render(
    <TeamMembersTable
      orgSlug="acme"
      actorUserId={actorUserId}
      actorRole={actorRole}
      members={team}
      timeZone="Asia/Karachi"
    />,
  );
}

describe("TeamMembersTable", () => {
  it("lets an owner change roles of admins and members, never owners or themselves", () => {
    renderAs("owner-id", "owner");

    expect(
      screen.getByRole("combobox", { name: "Role for Ali" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Role for Sam" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Role for Mia" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Role for Owen" }),
    ).not.toBeInTheDocument();
  });

  it("lets an owner deactivate anyone except themselves", () => {
    renderAs("owner-id", "owner");

    expect(
      screen.getByRole("button", { name: "Deactivate Ali" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Deactivate Sam" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Deactivate Mia" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Deactivate Owen" }),
    ).not.toBeInTheDocument();
  });

  it("never lets an admin change roles", () => {
    renderAs("admin-id", "admin");

    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
  });

  it("lets an admin deactivate members only", () => {
    renderAs("admin-id", "admin");

    expect(
      screen.getByRole("button", { name: "Deactivate Mia" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Deactivate Sam" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Deactivate Owen" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Deactivate Ali" }),
    ).not.toBeInTheDocument();
  });

  it("marks the signed-in person", () => {
    renderAs("admin-id", "admin");

    expect(screen.getByText("(you)")).toBeInTheDocument();
  });
});
