import { SITE_NAME } from "@/constants/site";
import { cn } from "@/lib/utils";

import { LogoMark } from "./LogoMark";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[1.0625rem] font-semibold tracking-tight",
        className,
      )}
    >
      <LogoMark />
      {SITE_NAME}
    </span>
  );
}
