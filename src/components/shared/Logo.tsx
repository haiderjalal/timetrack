import { Clock } from "lucide-react";

import { SITE_NAME } from "@/constants/site";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-lg bg-brand text-brand-foreground"
      >
        <Clock className="size-4" strokeWidth={2.25} />
      </span>
      {SITE_NAME}
    </span>
  );
}
