import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/shared/Logo";
import { ROUTES } from "@/constants/routes";
import { GoogleSignInForm } from "@/features/auth/components/GoogleSignInForm";
import { LoginErrorMessage } from "@/features/auth/components/LoginErrorMessage";
import { SignInBrandPanel } from "@/features/auth/components/SignInBrandPanel";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to TimeTrack with your Google account.",
  alternates: { canonical: ROUTES.login },
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <SignInBrandPanel />

      <main className="relative isolate flex items-center justify-center overflow-hidden bg-canvas px-4 py-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-dot-grid opacity-60"
        />
        <div className="flex w-full max-w-sm flex-col gap-8">
          <Link
            href={ROUTES.home}
            aria-label="TimeTrack home"
            className="self-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring lg:hidden"
          >
            <Logo />
          </Link>

          <section
            aria-labelledby="login-title"
            className="flex flex-col gap-6 rounded-2xl border bg-card p-6 shadow-xl shadow-brand/10 sm:p-8"
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
              We only use your name, email address and profile photo from
              Google.
            </p>
          </section>

          <Link
            href={ROUTES.home}
            className="self-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to the homepage
          </Link>
        </div>
      </main>
    </div>
  );
}
