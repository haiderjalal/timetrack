import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clockIn, clockOut } from "../actions/clock";
import { describeClockFailure } from "../utils/clockErrors";
import { ClockCard } from "./ClockCard";

import type { ClockCardProps } from "./ClockCard";
import type { TimeEntry } from "../types/timeEntry";

vi.mock("../actions/clock", () => ({
  clockIn: vi.fn(),
  clockOut: vi.fn(),
}));

const clockInMock = vi.mocked(clockIn);
const clockOutMock = vi.mocked(clockOut);

const SERVER_NOW = Date.parse("2026-11-03T09:00:00Z");

const ENTRY: TimeEntry = {
  id: "entry-1",
  workDate: "2026-11-03",
  clockInAt: "2026-11-03T06:00:00Z",
  clockOutAt: null,
  clockInSource: "web",
  autoClosed: false,
  note: null,
};

function renderCard(overrides: Partial<ClockCardProps> = {}) {
  return render(
    <ClockCard
      orgSlug="acme"
      serverNow={SERVER_NOW}
      running={null}
      closedSeconds={0}
      requiredMinutes={480}
      isWorkingDay
      autoClosedAt={null}
      {...overrides}
    />,
  );
}

describe("ClockCard", () => {
  beforeEach(() => {
    clockInMock.mockReset();
    clockOutMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts idle, with progress toward today's required hours", () => {
    renderCard({ closedSeconds: 2 * 3600 });

    expect(screen.getByRole("button", { name: "Clock in" })).toBeEnabled();
    expect(screen.getByText("You're clocked out")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Time worked today" }),
    ).toHaveAttribute("aria-valuetext", "2 hours of 8 hours");
    expect(screen.getByText("6h", { exact: false })).toBeInTheDocument();
  });

  it("clocks in for this org and announces it once", async () => {
    clockInMock.mockResolvedValue({
      success: true,
      message: "Clocked in at 14:00.",
      data: { entry: ENTRY },
    });
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Clock in" }));

    expect(clockInMock).toHaveBeenCalledWith({ orgSlug: "acme" });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Clocked in at 14:00.",
      ),
    );
  });

  it("shows the running session and keeps the timer moving", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(SERVER_NOW);
    renderCard({
      running: { clockInAt: "2026-11-03T06:00:00Z", time: "11:00" },
      closedSeconds: 3600,
    });

    expect(screen.getByText(/clocked in since/i)).toHaveTextContent(
      "You're clocked in since 11:00",
    );
    expect(screen.getByText("03:00:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clock out" })).toBeEnabled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText("03:00:05")).toBeInTheDocument();
  });

  it("sends the note with the clock-out", async () => {
    clockOutMock.mockResolvedValue({
      success: true,
      message: "Clocked out at 18:00.",
      data: { entry: { ...ENTRY, clockOutAt: "2026-11-03T13:00:00Z" } },
    });
    renderCard({
      running: { clockInAt: "2026-11-03T06:00:00Z", time: "11:00" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    fireEvent.change(screen.getByLabelText(/note for this session/i), {
      target: { value: "Client visit" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Clock out" }));

    expect(clockOutMock).toHaveBeenCalledWith({
      orgSlug: "acme",
      note: "Client visit",
    });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Clocked out at 18:00.",
      ),
    );
  });

  it("shows a failure inline with a way to try again", async () => {
    clockInMock.mockResolvedValue(describeClockFailure("unknown", "clock_in"));
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Clock in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't clock you in. Check your connection and try again.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(clockInMock).toHaveBeenCalledTimes(2);
  });

  it("treats a network error like any other failure", async () => {
    clockInMock.mockRejectedValue(new Error("Failed to fetch"));
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Clock in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't clock you in.",
    );
  });

  it("explains that time on a day off is overtime", () => {
    renderCard({ isWorkingDay: false, requiredMinutes: 0 });

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(
      screen.getByText("Day off. Any time you work today counts as overtime."),
    ).toBeInTheDocument();
  });

  it("says when the last session was closed automatically", () => {
    renderCard({ autoClosedAt: "18:00" });

    expect(
      screen.getByText(/we closed your last session automatically/i),
    ).toHaveTextContent("18:00");
  });
});
