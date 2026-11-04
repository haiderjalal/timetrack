import { logger } from "@/lib/logger";

interface PostgrestLikeError {
  code?: string;
}

/** A failed query. The message names the operation only, never SQL or data. */
export class DataAccessError extends Error {
  readonly operation: string;
  readonly code: string | null;

  constructor(operation: string, code: string | null) {
    super(`Data access failed: ${operation}`);
    this.name = "DataAccessError";
    this.operation = operation;
    this.code = code;
  }
}

/** Logs a failed query with the operation and Postgres code only. */
export function logDataAccessFailure(
  operation: string,
  error: PostgrestLikeError,
): void {
  logger.error("db.query_failed", { operation, code: error.code ?? null });
}

/** Logs a failed query and throws, for reads the page can't render without. */
export function failDataAccess(
  operation: string,
  error: PostgrestLikeError,
): never {
  logDataAccessFailure(operation, error);
  throw new DataAccessError(operation, error.code ?? null);
}
