import "server-only";

import { failDataAccess } from "@/lib/supabase/errors";
import { toRpcFailure } from "@/lib/supabase/rpcFailure";
import { isInvitableRole } from "@/features/organizations/utils/roles";

import { INVITATION_PREVIEW_STATES } from "../types/invitation";
import { INVITATION_FAILURES } from "../utils/invitationErrors";

import type { InvitableRole } from "@/features/organizations/utils/roles";
import type { TypedSupabaseClient } from "@/lib/supabase/server";
import type { InvitationFailure } from "../utils/invitationErrors";
import type {
  InvitationPreview,
  InvitationPreviewState,
  OpenInvitation,
} from "../types/invitation";

export type InvitationResult =
  { ok: true } | { ok: false; failure: InvitationFailure };

export type AcceptInvitationResult =
  | { ok: true; organizationSlug: string }
  | { ok: false; failure: InvitationFailure };

export interface CreateInvitationParams {
  orgId: string;
  email: string;
  role: InvitableRole;
  tokenHash: string;
}

const UNAVAILABLE_PREVIEW: InvitationPreview = {
  state: "unavailable",
  organizationName: null,
  organizationSlug: null,
  role: null,
};

/** create_invitation() checks who is asking, the role, and the duplicate rules. */
export async function createInvitationRecord(
  supabase: TypedSupabaseClient,
  params: CreateInvitationParams,
): Promise<InvitationResult> {
  const { error } = await supabase.rpc("create_invitation", {
    p_org_id: params.orgId,
    p_email: params.email,
    p_role: params.role,
    p_token_hash: params.tokenHash,
  });

  if (error) {
    return {
      ok: false,
      failure: toRpcFailure("invitations.create", error, INVITATION_FAILURES),
    };
  }

  return { ok: true };
}

export async function revokeInvitationRecord(
  supabase: TypedSupabaseClient,
  invitationId: string,
): Promise<InvitationResult> {
  const { error } = await supabase.rpc("revoke_invitation", {
    p_invitation_id: invitationId,
  });

  if (error) {
    return {
      ok: false,
      failure: toRpcFailure("invitations.revoke", error, INVITATION_FAILURES),
    };
  }

  return { ok: true };
}

/** Invitations nobody has accepted or revoked yet, newest first. Admins see them under RLS. */
export async function listOpenInvitations(
  supabase: TypedSupabaseClient,
  orgId: string,
): Promise<OpenInvitation[]> {
  const { data, error } = await supabase
    .from("invitations")
    .select("id, email, role, expires_at")
    .eq("org_id", orgId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) failDataAccess("invitations.list_open", error);

  // The database never stores an owner invitation, so this only drops rows that
  // can't exist.
  return data.flatMap((row) =>
    isInvitableRole(row.role)
      ? [
          {
            id: row.id,
            email: row.email,
            role: row.role,
            expiresAt: row.expires_at,
          },
        ]
      : [],
  );
}

export async function previewInvitationRecord(
  supabase: TypedSupabaseClient,
  token: string,
): Promise<InvitationPreview> {
  const { data, error } = await supabase.rpc("preview_invitation", {
    p_token: token,
  });

  if (error) failDataAccess("invitations.preview", error);

  const row = data[0];
  if (!row) return UNAVAILABLE_PREVIEW;

  return {
    state: toPreviewState(row.invitation_state),
    organizationName: row.organization_name,
    organizationSlug: row.organization_slug,
    role: row.invited_role,
  };
}

export async function acceptInvitationRecord(
  supabase: TypedSupabaseClient,
  token: string,
): Promise<AcceptInvitationResult> {
  const { data, error } = await supabase.rpc("accept_invitation", {
    p_token: token,
  });

  if (error) {
    return {
      ok: false,
      failure: toRpcFailure("invitations.accept", error, INVITATION_FAILURES),
    };
  }

  return { ok: true, organizationSlug: data.slug };
}

function toPreviewState(value: string): InvitationPreviewState {
  return (
    INVITATION_PREVIEW_STATES.find((state) => state === value) ?? "unavailable"
  );
}
