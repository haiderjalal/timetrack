import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LogoMark } from "@/components/shared/LogoMark";
import { ROUTES } from "@/constants/routes";

export function CtaBand() {
  return (
    <section aria-labelledby="cta-title" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="relative mx-auto flex max-w-6xl reveal flex-col items-center gap-6 overflow-hidden rounded-3xl bg-brand-mark px-6 py-16 text-center text-brand-mark-foreground sm:px-12">
        {/* Oversized mark as a quiet watermark. */}
        <LogoMark className="pointer-events-none absolute -right-16 -bottom-20 size-72 opacity-10" />
        <LogoMark className="size-12" />
        <h2
          id="cta-title"
          className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
        >
          Know where every hour goes.
        </h2>
        <p className="max-w-lg text-base text-pretty text-brand-mark-muted">
          Set up your organization in a couple of minutes. Your team clocks in
          from day one.
        </p>
        <Link
          href={ROUTES.login}
          className="group inline-flex h-11 items-center gap-2 rounded-xl bg-brand-mark-foreground px-5 text-base font-semibold text-brand-mark transition hover:bg-brand-mark-muted focus-visible:ring-3 focus-visible:ring-brand-mark-foreground/60 focus-visible:outline-none"
        >
          Get started with Google
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </section>
  );
}
