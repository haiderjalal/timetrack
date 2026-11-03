import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressRing } from "./ProgressRing";

describe("ProgressRing", () => {
  it("is a real progressbar with a spoken value", () => {
    render(
      <ProgressRing
        value={75}
        label="Hours worked today"
        valueText="6 hours of 8 hours"
      >
        6h
      </ProgressRing>,
    );

    const ring = screen.getByRole("progressbar", {
      name: "Hours worked today",
    });
    expect(ring).toHaveAttribute("value", "75");
    expect(ring).toHaveAttribute("max", "100");
    expect(ring).toHaveAttribute("aria-valuetext", "6 hours of 8 hours");
    expect(ring.style.getPropertyValue("--ring-value")).toBe("75");
  });

  it("keeps the native value at 100 while drawing the overtime lap", () => {
    render(<ProgressRing value={130} label="Hours" valueText="10h 24m" />);

    const ring = screen.getByRole("progressbar");
    expect(ring).toHaveAttribute("value", "100");
    expect(ring.style.getPropertyValue("--ring-value")).toBe("130");
  });

  it("clamps out-of-range values", () => {
    const { rerender } = render(
      <ProgressRing value={-5} label="Hours" valueText="none" />,
    );
    expect(
      screen.getByRole("progressbar").style.getPropertyValue("--ring-value"),
    ).toBe("0");

    rerender(<ProgressRing value={999} label="Hours" valueText="lots" />);
    expect(
      screen.getByRole("progressbar").style.getPropertyValue("--ring-value"),
    ).toBe("200");
  });

  it("hides the decorative center from screen readers", () => {
    render(
      <ProgressRing value={50} label="Hours" valueText="4 hours">
        <span>4h</span>
      </ProgressRing>,
    );

    expect(screen.getByText("4h").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
