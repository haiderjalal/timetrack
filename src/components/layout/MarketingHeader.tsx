import Link from "next/link";

import { Logo } from "@/components/shared/Logo";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/routes";

const SECTIONS = [
  { href: "#features", label: "Features" },
  { href: "#tour", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
];

/** Sticky header; `.site-header` (globals.css) adds a shadow once it's stuck. */
export function MarketingHeader() {
  return (
    <div className="site-header">
      <header className="site-header-bar border-b bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href={ROUTES.home}
            aria-label="TimeTrack home"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <Logo />
          </Link>
          <nav aria-label="Sections" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {SECTIONS.map((section) => (
                <li key={section.href}>
                  <a
                    href={section.href}
                    className={buttonVariants({
                      variant: "ghost",
                      className: "text-muted-foreground",
                    })}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href={ROUTES.login}
              className={buttonVariants({ variant: "ghost" })}
            >
              Sign in
            </Link>
            {/* Wrapper owns the visibility: buttonVariants already sets display. */}
            <span className="hidden sm:inline-flex">
              <Link href={ROUTES.login} className={buttonVariants()}>
                Get started
              </Link>
            </span>
          </div>
        </div>
      </header>
    </div>
  );
}
