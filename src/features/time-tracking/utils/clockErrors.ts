import type { ApiFailure } from "@/types/api";

/** Why clock_in() / clock_out() refused, from the error message they raise. */
export type ClockFailure =
  | "already_clocked_in"
  | "not_clocked_in"
  | "not_a_member"
  | "invalid_input"
  | "session_overlap"
  | "unknown";

const KNOWN_FAILURES: readonly ClockFailure[] = [
  "already_clocked_in",
  "not_clocked_in",
  "not_a_member",
  "invalid_input",
  "session_overlap",
];

export function toClockFailure(
  databaseMessage: string | undefined,
): ClockFailure {
  return (
    KNOWN_FAILURES.find((failure) => failure === databaseMessage) ?? "unknown"
  );
}

/** What the person sees. Never the database's own wording. */
export function describeClockFailure(
  failure: ClockFailure,
  action: "clock_in" | "clock_out",
): ApiFailure {
  switch (failure) {
    case "already_clocked_in":
      return { success: false, message: "You're already clocked in." };
    case "not_clocked_in":
      return {
        success: false,
        message: "You're not clocked in. Your session may already be closed.",
      };
    case "not_a_member":
      return {
        success: false,
        message: "You're no longer an active member of this organization.",
      };
    case "invalid_input":
      return {
        success: false,
        message: "Check your note and try again.",
        errors: [
          { field: "note", message: "Keep the note to 500 characters." },
        ],
      };
    case "session_overlap":
      return {
        success: false,
        message:
          "This overlaps a session already recorded. Ask an admin to check your times.",
      };
    case "unknown":
      return {
        success: false,
        message:
          action === "clock_in"
            ? "Couldn't clock you in. Check your connection and try again."
            : "Couldn't clock you out. Check your connection and try again.",
      };
  }
}
