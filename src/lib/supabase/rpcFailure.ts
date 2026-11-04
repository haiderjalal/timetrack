import { logDataAccessFailure } from "./errors";

/**
 * The failure a database function raised, when the app knows it. Anything else
 * is "unknown", so raw database wording never reaches the page.
 */
export function matchRpcFailure<TFailure extends string>(
  databaseMessage: string | undefined,
  knownFailures: readonly TFailure[],
): TFailure | "unknown" {
  return (
    knownFailures.find((failure) => failure === databaseMessage) ?? "unknown"
  );
}

/**
 * Maps a failed RPC to a known failure. An unrecognized error is logged by
 * operation and code only, then reported as "unknown".
 */
export function toRpcFailure<TFailure extends string>(
  operation: string,
  error: { message: string; code?: string },
  knownFailures: readonly TFailure[],
): TFailure | "unknown" {
  const failure = matchRpcFailure(error.message, knownFailures);
  if (failure === "unknown") logDataAccessFailure(operation, error);
  return failure;
}
