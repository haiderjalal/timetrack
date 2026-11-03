import Link from "next/link";

import { Logo } from "@/components/shared/Logo";
import { ROUTES } from "@/constants/routes";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#tour", label: "Product" },
  { href: "/#how-it-works", label: "How it works" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
        <div className="flex max-w-xs flex-col gap-3">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Attendance and time tracking for teams: clock in, overtime, leave
            and monthly reports.
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-12 text-sm">
          <div className="flex flex-col gap-3">
            <p className="font-semibold">Product</p>
            <ul className="flex flex-col gap-2">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-semibold">Account</p>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href={ROUTES.login}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      <div className="border-t">
        <p className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
          © TimeTrack. Made for teams who care where the hours go.
        </p>
      </div>
    </footer>
  );
}
