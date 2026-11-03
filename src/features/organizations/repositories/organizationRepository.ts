import "server-only";

import { failDataAccess, logDataAccessFailure } from "@/lib/supabase/errors";

import { toCreateOrganizationFailure } from "../utils/createOrganizationErrors";

import type { Membership } from "../types/organization";
import type { CreateOrganizationFailure } from "../utils/createOrganizationErrors";
import type { TypedSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

export interface CreateOrganizationParams {
  name: string;
  slug: string;
  timezone: string;
  schedule: Json;
}

export type CreateOrganizationResult =
  | { ok: true; slug: string }
  | { ok: false; failure: CreateOrganizationFailure };

/** The person's active memberships in orgs that aren't deleted, oldest first. */
export async function listActiveMemberships(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<Membership[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select(
      "role, organization:organizations!inner(id, name, slug, timezone, week_starts_on)",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .is("organization.deleted_at", null)
    .order("joined_at", { ascending: true });

  if (error) failDataAccess("organizations.list_memberships", error);

  return data.map(({ role, organization }) => ({
    role,
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      timezone: organization.timezone,
      weekStartsOn: organization.week_starts_on,
    },
  }));
}

export async function getLastOrganizationId(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("last_org_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) failDataAccess("profiles.get_last_org", error);
  return data?.last_org_id ?? null;
}

/** Remembers where to land after the next sign-in. Writes only when it changes. */
export async function rememberLastOrganization(
  supabase: TypedSupabaseClient,
  userId: string,
  orgId: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ last_org_id: orgId })
    .eq("id", userId)
    .or(`last_org_id.is.null,last_org_id.neq.${orgId}`);

  if (error) failDataAccess("profiles.remember_last_org", error);
}

export async function countActiveMembers(
  supabase: TypedSupabaseClient,
  orgId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "active");

  if (error) failDataAccess("organizations.count_members", error);
  return count ?? 0;
}

/** Calls create_organization(): org, owner membership, hours and leave types at once. */
export async function createOrganizationRecord(
  supabase: TypedSupabaseClient,
  params: CreateOrganizationParams,
): Promise<CreateOrganizationResult> {
  const { data, error } = await supabase.rpc("create_organization", {
    p_name: params.name,
    p_slug: params.slug,
    p_timezone: params.timezone,
    p_schedule: params.schedule,
  });

  if (error) {
    const failure = toCreateOrganizationFailure(error.message);
    if (failure === "unknown")
      logDataAccessFailure("organizations.create", error);
    return { ok: false, failure };
  }

  return { ok: true, slug: data.slug };
}
