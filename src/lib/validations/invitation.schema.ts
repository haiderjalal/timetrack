import { z } from "zod";

/** Caps one request, so a single paste can't email dozens of people at once. */
export const MAX_INVITES_PER_REQUEST = 25;

/** `owner` is never invited: see canInviteAs() in organizations/utils/roles.ts. */
export const INVITABLE_ROLES = ["admin", "member"] as const;

/** 32 random bytes, base64url-encoded: 43 URL-safe characters. */
export const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const emailSchema = z.email({ message: "Enter a valid email address." });

export interface ParsedInviteEmails {
  emails: string[];
  invalid: string[];
}

/**
 * Splits a pasted list on commas, semicolons and whitespace, lowercases it,
 * drops repeats, and sets aside anything that isn't an address.
 */
export function parseInviteEmails(text: string): ParsedInviteEmails {
  const candidates = new Set(
    text
      .toLowerCase()
      .split(/[\s,;]+/)
      .filter(Boolean),
  );
  const emails: string[] = [];
  const invalid: string[] = [];

  for (const candidate of candidates) {
    if (emailSchema.safeParse(candidate).success) emails.push(candidate);
    else invalid.push(candidate);
  }

  return { emails, invalid };
}

/** The invite dialog's form: pasted text, checked before it's sent. */
export const inviteFormSchema = z.object({
  emailsText: z.string().superRefine((text, context) => {
    const { emails, invalid } = parseInviteEmails(text);

    if (invalid.length > 0) {
      context.addIssue({
        code: "custom",
        message: `Check these addresses: ${invalid.join(", ")}`,
      });
    } else if (emails.length === 0) {
      context.addIssue({
        code: "custom",
        message: "Add at least one email address.",
      });
    } else if (emails.length > MAX_INVITES_PER_REQUEST) {
      context.addIssue({
        code: "custom",
        message: `Invite up to ${MAX_INVITES_PER_REQUEST} people at a time.`,
      });
    }
  }),
  role: z.enum(INVITABLE_ROLES, { message: "Choose a role." }),
});

/** The server re-checks everything the form checked, because the browser can be bypassed. */
export const inviteMembersSchema = z.object({
  emails: z
    .array(emailSchema)
    .min(1, { message: "Add at least one email address." })
    .max(MAX_INVITES_PER_REQUEST, {
      message: `Invite up to ${MAX_INVITES_PER_REQUEST} people at a time.`,
    }),
  role: z.enum(INVITABLE_ROLES, { message: "Choose a role." }),
});

export type InviteFormValues = z.infer<typeof inviteFormSchema>;
export type InviteMembersInput = z.infer<typeof inviteMembersSchema>;
