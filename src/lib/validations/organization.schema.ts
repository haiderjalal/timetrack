import { z } from "zod";

import { isValidTimeZone } from "@/lib/time/zonedNow";

import { scheduleSchema } from "./schedule.schema";

// Mirror the database checks on organizations (docs/database.md §4.2).
export const ORGANIZATION_NAME_MAX_LENGTH = 80;
export const SLUG_MAX_LENGTH = 40;
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

/** Shared by the onboarding form and the createOrganization Server Action. */
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Enter a name with at least 2 characters." })
    .max(ORGANIZATION_NAME_MAX_LENGTH, {
      message: `Keep the name to ${ORGANIZATION_NAME_MAX_LENGTH} characters or fewer.`,
    }),
  slug: z.string().trim().regex(SLUG_PATTERN, {
    message:
      "Use 3–40 lowercase letters, numbers or hyphens, starting and ending with a letter or number.",
  }),
  timezone: z
    .string()
    .refine(isValidTimeZone, { message: "Choose a timezone from the list." }),
  schedule: scheduleSchema,
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
