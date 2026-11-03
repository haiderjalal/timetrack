import Link from "next/link";

import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export function MarketingHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href={ROUTES.home}
          aria-label="TimeTrack home"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Logo />
        </Link>
        <Button asChild variant="ghost">
          <Link href={ROUTES.login}>Sign in</Link>
        </Button>
      </div>
    </header>
  );
}
