import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { listDates } from "@/lib/time/calendarDate";

import { AttendanceCalendar } from "./AttendanceCalendar";

import type { DayStatus, DaySummary } from "../types/attendance";

function summary(
  isoDate: string,
  overrides: Partial<DaySummary> = {},
): DaySummary {
  return {
    isoDate,
    status: "complete" as DayStatus,
    isWorkingDay: true,
    requiredMinutes: 480,
    workedMinutes: 480,
    overtimeMinutes: 0,
    shortfallMinutes: 0,
    isLate: false,
    sessionCount: 1,
    hasOpenSession: false,
    autoClosedSessions: 0,
    ...overrides,
  };
}

// November 2026 starts on a Sunday; "today" is Wednesday the 4th.
const DAYS = listDates("2026-11-01", "2026-11-30").map((isoDate) => {
  if (isoDate === "2026-11-01") {
    return summary(isoDate, {
      status: "day_off",
      isWorkingDay: false,
      requiredMinutes: 0,
      workedMinutes: 0,
    });
  }
  if (isoDate === "2026-11-03") {
    return summary(isoDate, {
      status: "short",
      workedMinutes: 440,
      shortfallMinutes: 40,
      isLate: true,
    });
  }
  if (isoDate === "2026-11-04") {
    return summary(isoDate, { status: "in_progress", workedMinutes: 120 });
  }
  if (isoDate > "2026-11-04") {
    return summary(isoDate, { status: "upcoming", workedMinutes: 0 });
  }
  return summary(isoDate, { workedMinutes: 505, overtimeMinutes: 25 });
});

function renderCalendar() {
  render(
    <>
      <h2 id="month">November 2026</h2>
      <AttendanceCalendar
        titleId="month"
        days={DAYS}
        weekStartsOn={1}
        todayIsoDate="2026-11-04"
      />
    </>,
  );
}

describe("AttendanceCalendar", () => {
  it("is a grid named after the month, weeks starting on the org's weekday", () => {
    renderCalendar();

    expect(
      screen.getByRole("grid", { name: "November 2026" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });

  it("says in words what each day's color and icon show", () => {
    renderCalendar();

    expect(
      screen.getByRole("link", {
        name: "Tue, 3 Nov: Short, 7 hours 20 minutes worked, 40 minutes short, late",
      }),
    ).toHaveAttribute("href", "#day-2026-11-03");
    expect(
      screen.getByRole("link", {
        name: "Mon, 2 Nov: Overtime, 8 hours 25 minutes worked, 25 minutes overtime",
      }),
    ).toBeInTheDocument();
  });

  it("has one tab stop, on today, and no links for days to come", () => {
    renderCalendar();

    const today = screen.getByRole("link", { name: /^Wed, 4 Nov/ });
    expect(today).toHaveAttribute("tabindex", "0");
    expect(today).toHaveAttribute("aria-current", "date");
    expect(
      screen
        .getAllByRole("link")
        .filter((link) => link.getAttribute("tabindex") === "0"),
    ).toHaveLength(1);
    expect(
      screen.queryByRole("link", { name: /5 Nov/ }),
    ).not.toBeInTheDocument();
  });

  it("moves between days with the arrow keys, Home and End", () => {
    renderCalendar();
    const today = screen.getByRole("link", { name: /^Wed, 4 Nov/ });
    today.focus();

    fireEvent.keyDown(today, { key: "ArrowLeft" });
    const tuesday = screen.getByRole("link", { name: /^Tue, 3 Nov/ });
    expect(tuesday).toHaveFocus();
    expect(tuesday).toHaveAttribute("tabindex", "0");
    expect(today).toHaveAttribute("tabindex", "-1");

    fireEvent.keyDown(tuesday, { key: "ArrowUp" });
    expect(screen.getByRole("link", { name: /^Sun, 1 Nov/ })).not.toHaveFocus();
    expect(tuesday).toHaveFocus();

    fireEvent.keyDown(tuesday, { key: "Home" });
    expect(screen.getByRole("link", { name: /^Mon, 2 Nov/ })).toHaveFocus();

    fireEvent.keyDown(document.activeElement as Element, { key: "End" });
    expect(today).toHaveFocus();
  });
});
