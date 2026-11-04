import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createInvitationRecord } from "../repositories/invitationRepository";
import { createInvitationToken } from "./invitationToken";

import type { InvitableRole } from "@/features/organizations/utils/roles";
import type { InvitationFailure } from "../utils/invitationErrors";

/** Failures that apply to every address, so one of them stops the whole request. */
const REQUEST_WIDE_FAILURES: readonly InvitationFailure[] = [
  "not_allowed",
  "invalid_role",
  "not_authenticated",
  "unknown",
];

export interface SentInvitation {
  email: string;
  /** Only ever placed in the invitation email. */
  token: string;
}

export interface InviteMembersOutcome {
  sent: SentInvitation[];
  alreadyMembers: string[];
  /** Addresses that couldn't be invited this time, for example after a concurrent invite. */
  failed: string[];
}

export type InviteMembersResult =
  | { ok: true; outcome: InviteMembersOutcome }
  | { ok: false; failure: InvitationFailure };

/**
 * Creates one invitation per address. Each gets its own token. An address that
 * already has an open invitation gets a new one, and the database revokes the old.
 */
export async function inviteMembersToOrganization({
  orgId,
  emails,
  role,
}: {
  orgId: string;
  emails: string[];
  role: InvitableRole;
}): Promise<InviteMembersResult> {
  const supabase = await createSupabaseServerClient();

  const results = await Promise.all(
    emails.map(async (email) => {
      const { token, tokenHash } = createInvitationToken();
      const result = await createInvitationRecord(supabase, {
        orgId,
        email,
        role,
        tokenHash,
      });
      return { email, token, result };
    }),
  );

  for (const { result } of results) {
    if (!result.ok && REQUEST_WIDE_FAILURES.includes(result.failure)) {
      return { ok: false, failure: result.failure };
    }
  }

  const outcome: InviteMembersOutcome = {
    sent: [],
    alreadyMembers: [],
    failed: [],
  };

  for (const { email, token, result } of results) {
    if (result.ok) outcome.sent.push({ email, token });
    else if (result.failure === "already_member")
      outcome.alreadyMembers.push(email);
    else outcome.failed.push(email);
  }

  return { ok: true, outcome };
}
