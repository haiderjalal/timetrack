"use client";

import { useSelectedLayoutSegment } from "next/navigation";

import { getNavItemBySegment } from "../constants/navigation";

/** The page's h1, in the top bar like the design. Visually hidden on phones. */
export function PageTitle() {
  const item = getNavItemBySegment(useSelectedLayoutSegment());

  return (
    <h1 className="truncate text-lg font-semibold tracking-tight max-md:sr-only">
      {item?.label ?? "TimeTrack"}
    </h1>
  );
}
