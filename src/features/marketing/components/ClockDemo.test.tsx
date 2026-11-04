import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClockDemo } from "./ClockDemo";

describe("ClockDemo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function ring() {
    return screen.getByRole("progressbar", { name: "Hours worked today" });
  }

  it("starts clocked out at 7h 30m", () => {
    render(<ClockDemo />);

    expect(screen.getByRole("button", { name: "Clock in" })).toBeVisible();
    expect(ring()).toHaveAttribute(
      "aria-valuetext",
      "7 hours 30 minutes of 8 hours",
    );
    expect(screen.getByText("30m to go")).toBeVisible();
  });

  it("runs the day at 60x once clocked in, then reaches overtime", () => {
    render(<ClockDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Clock in" }));
    expect(screen.getByText("Clocked in at 17:17.")).toBeInTheDocument();
    expect(screen.getByText(/Clocked in since 17:17/)).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(ring()).toHaveAttribute("aria-valuetext", "8 hours of 8 hours");
    expect(
      screen.getByText("8 hours done. Overtime starts now."),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByText("+5m overtime")).toBeVisible();
  });

  it("stops the clock and logs the session on clock out", () => {
    render(<ClockDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Clock in" }));
    act(() => {
      vi.advanceTimersByTime(12_000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Clock out" }));

    expect(screen.getByText("17:17 → 17:29")).toBeVisible();
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(ring()).toHaveAttribute(
      "aria-valuetext",
      "7 hours 42 minutes of 8 hours",
    );
  });

  it("resets the demo", () => {
    render(<ClockDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Clock in" }));
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset demo" }));

    expect(screen.getByRole("button", { name: "Clock in" })).toBeVisible();
    expect(ring()).toHaveAttribute(
      "aria-valuetext",
      "7 hours 30 minutes of 8 hours",
    );
  });
});
