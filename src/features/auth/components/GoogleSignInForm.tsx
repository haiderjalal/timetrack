import { Suspense } from "react";

import { SubmitButton } from "@/components/shared/SubmitButton";

import { signInWithGoogle } from "../actions/signInWithGoogle";
import { firstParam, getSafeRedirectPath } from "../utils/redirects";
import { GoogleIcon } from "./GoogleIcon";

interface GoogleSignInFormProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function GoogleSignInForm({ searchParams }: GoogleSignInFormProps) {
  return (
    <form action={signInWithGoogle} className="flex flex-col">
      {/* The button renders in the static shell; the return path streams in. */}
      <Suspense fallback={null}>
        <NextPathField searchParams={searchParams} />
      </Suspense>
      <SubmitButton
        variant="outline"
        size="lg"
        fullWidth
        icon={<GoogleIcon />}
        pendingLabel="Redirecting to Google…"
      >
        Continue with Google
      </SubmitButton>
    </form>
  );
}

async function NextPathField({ searchParams }: GoogleSignInFormProps) {
  const next = getSafeRedirectPath(firstParam((await searchParams).next));
  return <input type="hidden" name="next" value={next} />;
}
