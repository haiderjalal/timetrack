import { z } from "zod";

import { SLUG_MAX_LENGTH } from "./organization.schema";

// Mirrors time_entries.note (docs/database.md §4.7).
export const CLOCK_NOTE_MAX_LENGTH = 500;

// The org is looked up by slug under the person's own membership, so this only
// keeps obviously broken input away from the database.
const orgSlugSchema = z.string().trim().min(1).max(SLUG_MAX_LENGTH);

export const clockInSchema = z.object({ orgSlug: orgSlugSchema });

/** Shared by the clock card's note field and the clockOut Server Action. */
export const clockOutSchema = z.object({
  orgSlug: orgSlugSchema,
  note: z
    .string()
    .trim()
    .max(CLOCK_NOTE_MAX_LENGTH, {
      message: `Keep the note to ${CLOCK_NOTE_MAX_LENGTH} characters.`,
    })
    .optional(),
});

export type ClockInInput = z.input<typeof clockInSchema>;
export type ClockOutInput = z.input<typeof clockOutSchema>;
