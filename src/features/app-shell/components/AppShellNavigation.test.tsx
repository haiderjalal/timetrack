import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getNavGroups } from "../utils/navigation";
import { MobileTabBar } from "./MobileTabBar";
import { PageTitle } from "./PageTitle";
import { SidebarNav } from "./SidebarNav";

import type { NavGroup } from "../constants/navigation";

vi.mock("next/navigation", () => ({
  useSelectedLayoutSegment: () => "dashboard",
}));

const meGroup: NavGroup = {
  id: "me",
  label: "Me",
  items: ["dashboard"],
  managersOnly: false,
};
const manageGroup: NavGroup = {
  id: "manage",
  label: "Manage",
  items: ["dashboard"],
  managersOnly: true,
};
const groups = [meGroup, manageGroup];

describe("getNavGroups", () => {
  it("never gives members the Manage group", () => {
    expect(getNavGroups("member", groups).map((group) => group.id)).toEqual([
      "me",
    ]);
  });

  it.each(["owner", "admin"] as const)("gives %s the Manage group", (role) => {
    expect(getNavGroups(role, groups).map((group) => group.id)).toEqual([
      "me",
      "manage",
    ]);
  });

  it("leaves out groups without pages yet", () => {
    expect(
      getNavGroups("owner", [{ ...manageGroup, items: [] }]).map(
        (group) => group.id,
      ),
    ).toEqual([]);
  });

  it("only links pages that exist today", () => {
    expect(getNavGroups("owner").flatMap((group) => group.items)).toEqual([
      "dashboard",
      "team",
    ]);
  });

  it("keeps the team page out of members' navigation", () => {
    expect(
      getNavGroups("member").flatMap((group) => group.items),
    ).not.toContain("team");
  });
});

describe("SidebarNav", () => {
  it("links each page in the org and marks the current one", () => {
    render(<SidebarNav orgSlug="acme" groups={getNavGroups("member")} />);

    const link = screen.getByRole("link", { name: "Dashboard" });
    expect(link).toHaveAttribute("href", "/o/acme/dashboard");
    expect(link).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Me" })).toBeInTheDocument();
  });
});

describe("MobileTabBar", () => {
  it("uses the short tab label", () => {
    render(<MobileTabBar orgSlug="acme" items={["dashboard"]} />);

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

describe("PageTitle", () => {
  it("names the current page", () => {
    render(<PageTitle />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeInTheDocument();
  });
});
