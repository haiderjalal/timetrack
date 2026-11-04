import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TabSwitcher } from "./TabSwitcher";

const TABS = [
  { id: "member", label: "For members", panel: <p>Member view</p> },
  { id: "admin", label: "For admins", panel: <p>Admin view</p> },
  { id: "report", label: "Reports", panel: <p>Report view</p> },
];

function renderTabs() {
  render(<TabSwitcher label="Product tour" tabs={TABS} />);
  return {
    tab: (name: string) => screen.getByRole("tab", { name }),
    list: screen.getByRole("tablist", { name: "Product tour" }),
  };
}

describe("TabSwitcher", () => {
  it("shows the first panel and links each tab to its panel", () => {
    const { tab } = renderTabs();

    expect(tab("For members")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Member view");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("For members");
    expect(screen.queryByText("Admin view")).not.toBeVisible();
  });

  it("switches panels on click", () => {
    const { tab } = renderTabs();

    fireEvent.click(tab("For admins"));

    expect(tab("For admins")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Admin view");
  });

  it("has a single tab stop", () => {
    const { tab } = renderTabs();

    expect(tab("For members")).toHaveAttribute("tabindex", "0");
    expect(tab("For admins")).toHaveAttribute("tabindex", "-1");
    expect(tab("Reports")).toHaveAttribute("tabindex", "-1");
  });

  it("moves with arrow keys, wraps around, and jumps with Home/End", () => {
    const { tab, list } = renderTabs();
    tab("For members").focus();

    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(tab("For admins")).toHaveFocus();
    expect(tab("For admins")).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(list, { key: "End" });
    expect(tab("Reports")).toHaveFocus();

    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(tab("For members")).toHaveFocus();

    fireEvent.keyDown(list, { key: "ArrowLeft" });
    expect(tab("Reports")).toHaveFocus();

    fireEvent.keyDown(list, { key: "Home" });
    expect(tab("For members")).toHaveFocus();
  });

  it("ignores unrelated keys", () => {
    const { tab, list } = renderTabs();

    fireEvent.keyDown(list, { key: "Enter" });
    expect(tab("For members")).toHaveAttribute("aria-selected", "true");
  });
});
