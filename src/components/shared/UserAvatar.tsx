import Image from "next/image";

import { getInitials } from "@/lib/getInitials";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  /** A Google profile photo (allow-listed in next.config.ts), or null. */
  avatarUrl: string | null;
  size: "sm" | "lg";
  className?: string;
}

const SIZES = {
  sm: { pixels: 32, className: "size-8 text-xs" },
  lg: { pixels: 56, className: "size-14 text-lg" },
} as const;

/** Profile photo, or initials when there isn't one. Decorative: the name is always shown nearby. */
export function UserAvatar({
  name,
  avatarUrl,
  size,
  className,
}: UserAvatarProps) {
  const { pixels, className: sizeClassName } = SIZES[size];

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={pixels}
        height={pixels}
        className={cn("shrink-0 rounded-full", sizeClassName, className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground",
        sizeClassName,
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
