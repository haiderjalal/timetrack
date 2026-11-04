const EXTERNAL_REQUEST_TIMEOUT_MS = 10_000;

/**
 * fetch with a deadline. A slow Supabase call fails after the deadline instead of
 * holding the page open. A signal the caller passes still cancels the request.
 */
export function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const deadline = AbortSignal.timeout(EXTERNAL_REQUEST_TIMEOUT_MS);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, deadline])
    : deadline;

  return fetch(input, { ...init, signal });
}
