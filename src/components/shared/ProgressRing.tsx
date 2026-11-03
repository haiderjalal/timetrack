import type { CSSProperties, ReactNode } from "react";

interface ProgressRingProps {
  /** 0–200. Up to 100 fills the ring; beyond that an overtime lap is drawn on top. */
  value: number;
  /** Accessible name, e.g. "Hours worked today". */
  label: string;
  /** What a screen reader hears for the value, e.g. "7 hours 30 minutes of 8 hours". */
  valueText: string;
  /** Shown in the middle of the ring. Hidden from screen readers: use valueText. */
  children?: ReactNode;
  /** Play the fill from empty once when the page loads. */
  fillOnLoad?: boolean;
  /** "on-brand" for rings sitting on a brand-colored surface. */
  variant?: "default" | "on-brand";
  className?: string;
}

/**
 * A circular progress indicator on a native <progress> element. Visuals live in
 * globals.css (`.progress-ring`); size it with className, e.g. "size-48".
 * Used inside client components, so it joins classes by hand instead of
 * importing `cn` (which would add ~10 KB to the page's JavaScript).
 */
export function ProgressRing({
  value,
  label,
  valueText,
  children,
  fillOnLoad = false,
  variant = "default",
  className,
}: ProgressRingProps) {
  const clamped = Math.min(200, Math.max(0, value));
  const ringClasses = [
    "progress-ring col-start-1 row-start-1",
    fillOnLoad ? "progress-ring-fill-on-load" : "",
    variant === "on-brand" ? "progress-ring-on-brand" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`relative grid place-items-center ${className ?? ""}`}>
      <progress
        value={Math.min(100, clamped)}
        max={100}
        aria-label={label}
        aria-valuetext={valueText}
        className={ringClasses}
        style={{ "--ring-value": clamped } as CSSProperties}
      />
      {children ? (
        <div
          aria-hidden="true"
          className="col-start-1 row-start-1 flex flex-col items-center text-center"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
