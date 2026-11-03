import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/shared/Logo";
import { ROUTES } from "@/constants/routes";
import { GoogleSignInForm } from "@/features/auth/components/GoogleSignInForm";
import { LoginErrorMessage } from "@/features/auth/components/LoginErrorMessage";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to TimeTrack with your Google account.",
  alternates: { canonical: ROUTES.login },
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Link
          href={ROUTES.home}
          aria-label="TimeTrack home"
          className="self-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Logo />
        </Link>

        <section
          aria-labelledby="login-title"
          className="flex flex-col gap-6 rounded-2xl border bg-card p-6 shadow-xs sm:p-8"
        >
          <div className="flex flex-col gap-1.5 text-center">
            <h1
              id="login-title"
              className="text-2xl font-semibold tracking-tight"
            >
              Sign in to TimeTrack
            </h1>
            <p className="text-sm text-muted-foreground">
              Use your Google account. New here? Signing in creates your
              account.
            </p>
          </div>

          <Suspense fallback={null}>
            <LoginErrorMessage searchParams={searchParams} />
          </Suspense>

          <GoogleSignInForm searchParams={searchParams} />

          <p className="text-center text-xs text-muted-foreground">
            We only use your name, email address and profile photo from Google.
          </p>
        </section>
      </div>
    </main>
  );
}
