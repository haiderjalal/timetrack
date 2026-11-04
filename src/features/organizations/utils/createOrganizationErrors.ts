import type { ApiFailure } from "@/types/api";

/** Why create_organization() refused, from the error message it raises. */
export type CreateOrganizationFailure =
  "slug_taken" | "invalid_timezone" | "invalid_input" | "unknown";

const KNOWN_FAILURES: readonly CreateOrganizationFailure[] = [
  "slug_taken",
  "invalid_timezone",
  "invalid_input",
];

export function toCreateOrganizationFailure(
  databaseMessage: string | undefined,
): CreateOrganizationFailure {
  if (databaseMessage === "invalid_schedule") return "invalid_input";
  return (
    KNOWN_FAILURES.find((failure) => failure === databaseMessage) ?? "unknown"
  );
}

/** What the person sees. Never the database's own wording. */
export function describeCreateOrganizationFailure(
  failure: CreateOrganizationFailure,
): ApiFailure {
  switch (failure) {
    case "slug_taken":
      return {
        success: false,
        message: "That URL is already taken.",
        errors: [
          {
            field: "slug",
            message: "That URL is already taken. Try another one.",
          },
        ],
      };
    case "invalid_timezone":
      return {
        success: false,
        message: "We don't recognize that timezone.",
        errors: [
          { field: "timezone", message: "Choose a timezone from the list." },
        ],
      };
    case "invalid_input":
      return {
        success: false,
        message: "Some details aren't valid. Check the form and try again.",
      };
    case "unknown":
      return {
        success: false,
        message: "We couldn't create your organization. Please try again.",
      };
  }
}
