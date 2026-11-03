import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

import { ClockPreview } from "./ClockPreview";

export function HeroSection() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-8">
      <div className="flex flex-col items-start gap-6">
        <p className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          Attendance for growing teams
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Clock in with one tap. See every hour your team works.
        </h1>
        <p className="max-w-prose text-base text-pretty text-muted-foreground">
          TimeTrack records working hours, overtime and leave for your whole
          organization, then turns them into a monthly report you can trust.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href={ROUTES.login}>
              Get started with Google
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href="#how-it-works">How it works</a>
          </Button>
        </div>
      </div>
      <ClockPreview />
    </section>
  );
}
