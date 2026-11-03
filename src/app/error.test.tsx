import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ErrorPage from "./error";

describe("root error page", () => {
  it("explains the failure and offers a way forward", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ErrorPage error={new Error("boom")} retry={() => {}} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Something went wrong" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("retries the segment when asked", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();

    render(<ErrorPage error={new Error("boom")} retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it("reports the error instead of swallowing it", () => {
    const report = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("boom");

    render(<ErrorPage error={error} retry={() => {}} />);

    expect(report).toHaveBeenCalledWith(error);
  });
});
