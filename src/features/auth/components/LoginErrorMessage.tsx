import { CircleAlert } from "lucide-react";

import { firstParam, getAuthErrorMessage } from "../utils/redirects";

interface LoginErrorMessageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Shows a friendly message for known error codes; unknown codes show nothing. */
export async function LoginErrorMessage({
  searchParams,
}: LoginErrorMessageProps) {
  const message = getAuthErrorMessage(firstParam((await searchParams).error));
  if (!message) return null;

  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-status-absent-soft px-3 py-2.5 text-sm text-status-absent-foreground"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
