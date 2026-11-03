type LogValue = string | number | boolean | null | undefined;
type LogContext = Record<string, LogValue>;
type LogLevel = "info" | "warn" | "error";

/**
 * Structured JSON logging. Pass identifiers and error codes only, never emails,
 * tokens or notes (docs/architecture.md §8).
 */
function write(level: LogLevel, event: string, context: LogContext = {}): void {
  const line = JSON.stringify({
    level,
    event,
    ...context,
    time: new Date().toISOString(),
  });

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    // eslint-disable-next-line no-console -- the logger is the one place allowed to print info
    console.info(line);
  }
}

export const logger = {
  info: (event: string, context?: LogContext) => write("info", event, context),
  warn: (event: string, context?: LogContext) => write("warn", event, context),
  error: (event: string, context?: LogContext) =>
    write("error", event, context),
};

/** A safe, loggable description of an unknown thrown value. */
export function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return typeof error === "string" ? error : "Unknown error";
}
