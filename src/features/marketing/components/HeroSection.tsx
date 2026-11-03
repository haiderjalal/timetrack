import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/routes";

import { ClockDemo } from "./ClockDemo";

import type { CSSProperties } from "react";

const HIGHLIGHTS = [
  "Google sign-in",
  "Works on any phone",
  "Times set by the server",
];

function enterDelay(ms: number): CSSProperties {
  return { "--enter-delay": `${ms}ms` } as CSSProperties;
}

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-dot-grid opacity-70"
      />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.05fr_1fr] md:py-24 lg:px-8">
        <div className="flex flex-col items-start gap-6">
          <p
            className="inline-flex animate-enter items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
            style={enterDelay(0)}
          >
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-brand"
            />
            Attendance for growing teams
          </p>
          {/* The LCP element: rendered as-is, never animated in. */}
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Clock in with <span className="text-brand">one tap</span>. See every
            hour your team works.
          </h1>
          <p
            className="max-w-prose animate-enter text-lg text-pretty text-muted-foreground"
            style={enterDelay(80)}
          >
            TimeTrack records working hours, overtime and leave for your whole
            organization, then turns them into a monthly report you can trust.
          </p>
          <div
            className="flex animate-enter flex-wrap items-center gap-3"
            style={enterDelay(160)}
          >
            <Link
              href={ROUTES.login}
              className={buttonVariants({ size: "lg", className: "group" })}
            >
              Get started with Google
              <ArrowRight
                data-icon="inline-end"
                aria-hidden="true"
                className="transition-transform motion-safe:group-hover:translate-x-0.5"
              />
            </Link>
            <a
              href="#tour"
              className={buttonVariants({ size: "lg", variant: "ghost" })}
            >
              See the product
            </a>
          </div>
          <ul
            className="flex animate-enter flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
            style={enterDelay(240)}
          >
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="size-4 text-brand" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-enter" style={enterDelay(120)}>
          <ClockDemo />
        </div>
      </div>
    </section>
  );
}
