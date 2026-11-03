"use client";

import { useId, useRef, useState } from "react";

import type { KeyboardEvent, ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  /** Rendered on the server and passed in; only the selection runs in the browser. */
  panel: ReactNode;
}

interface TabSwitcherProps {
  tabs: TabItem[];
  /** Accessible name for the tab list, e.g. "Product tour". */
  label: string;
}

/**
 * Tabs following the WAI-ARIA tabs pattern: one tab stop, arrow keys move
 * between tabs (and select them), Home/End jump to the ends. Kept tiny on
 * purpose: it ships on the landing page.
 */
export function TabSwitcher({ tabs, label }: TabSwitcherProps) {
  const baseId = useId();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function select(index: number) {
    const wrapped = (index + tabs.length) % tabs.length;
    setSelectedIndex(wrapped);
    tabRefs.current[wrapped]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = {
      ArrowRight: selectedIndex + 1,
      ArrowLeft: selectedIndex - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(target);
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
        className="inline-flex self-center rounded-xl border bg-muted p-1"
      >
        {tabs.map((tab, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelectedIndex(index)}
              className={`min-h-10 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
                isSelected
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={index !== selectedIndex}
          tabIndex={0}
          className="rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
