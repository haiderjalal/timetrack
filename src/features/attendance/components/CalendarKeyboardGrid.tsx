"use client";

import type { KeyboardEvent, ReactNode } from "react";

const COLUMNS = 7;
const NAVIGATION_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

interface CalendarKeyboardGridProps {
  labelledBy: string;
  children: ReactNode;
}

/**
 * The grid pattern for the month calendar (docs/design-system.md §7): one tab
 * stop, arrow keys between days, Home / End within a week, Enter opens the
 * day. Cells are server-rendered links marked `data-calendar-day` with their
 * `data-position` in the 7-column grid; this only moves focus between them.
 */
export function CalendarKeyboardGrid({
  labelledBy,
  children,
}: CalendarKeyboardGridProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const cells = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>("[data-calendar-day]"),
    );
    const current = cells.findIndex((cell) => cell === event.target);
    const from = cells[current];
    if (!from) return;

    const position = Number(from.dataset.position);
    const at = (target: number) =>
      cells.find((cell) => Number(cell.dataset.position) === target);
    const rowStart = position - (position % COLUMNS);
    const inRow = cells.filter((cell) => {
      const cellPosition = Number(cell.dataset.position);
      return cellPosition >= rowStart && cellPosition < rowStart + COLUMNS;
    });

    const next = {
      ArrowLeft: cells[current - 1],
      ArrowRight: cells[current + 1],
      ArrowUp: at(position - COLUMNS),
      ArrowDown: at(position + COLUMNS),
      Home: inRow[0],
      End: inRow.at(-1),
    }[event.key];

    if (NAVIGATION_KEYS.has(event.key)) event.preventDefault();
    if (!next || next === from) return;
    from.tabIndex = -1;
    next.tabIndex = 0;
    next.focus();
  }

  return (
    <table
      role="grid"
      aria-labelledby={labelledBy}
      onKeyDown={handleKeyDown}
      className="w-full table-fixed border-separate border-spacing-1"
    >
      {children}
    </table>
  );
}
