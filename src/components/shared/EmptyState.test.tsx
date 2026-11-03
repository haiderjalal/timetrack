import { render, screen } from "@testing-library/react";
import { Inbox } from "lucide-react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the title as a section heading by default", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No requests yet"
        description="Leave requests appear here."
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "No requests yet" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Leave requests appear here.")).toBeInTheDocument();
  });

  it("can be the page's main heading", () => {
    render(
      <EmptyState
        icon={Inbox}
        titleAs="h1"
        title="Page not found"
        description="Gone."
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
  });

  it("shows actions only when they are provided", () => {
    const { rerender } = render(
      <EmptyState icon={Inbox} title="Empty" description="Nothing." />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <EmptyState icon={Inbox} title="Empty" description="Nothing.">
        <button type="button">Request leave</button>
      </EmptyState>,
    );
    expect(
      screen.getByRole("button", { name: "Request leave" }),
    ).toBeInTheDocument();
  });
});
