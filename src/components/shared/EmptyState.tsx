import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Use "h1" when the empty state is the whole page (404, error pages). */
  titleAs?: "h1" | "h2";
  /** Primary and secondary actions, e.g. buttons or links. */
  children?: ReactNode;
}

// Rendered by the root error boundary too, so it stays free of client-heavy
// helpers like `cn`: every import here ships with every page.
export function EmptyState({
  icon: Icon,
  title,
  description,
  titleAs: Title = "h2",
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground"
      >
        <Icon className="size-6" strokeWidth={1.75} />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <Title className="text-lg font-semibold">{title}</Title>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}
