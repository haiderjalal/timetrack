"use server";

import { redirect } from "next/navigation";

import { ROUTES, orgDashboardPath } from "@/constants/routes";
import { requireUser } from "@/features/auth/services/currentUser";
import { logger } from "@/lib/logger";
import { createOrganizationSchema } from "@/lib/validations/organization.schema";

import { createOrganizationForCurrentUser } from "../services/createOrganization";
import { describeCreateOrganizationFailure } from "../utils/createOrganizationErrors";

import type { CreateOrganizationInput } from "@/lib/validations/organization.schema";
import type { ApiFailure } from "@/types/api";

/**
 * Onboarding submit. Validates again on the server (the browser's checks are
 * only a convenience), creates the org, then opens its dashboard. Returns only
 * when something went wrong.
 */
export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<ApiFailure> {
  const user = await requireUser(ROUTES.onboarding);

  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Check the highlighted fields and try again.",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    };
  }

  const result = await createOrganizationForCurrentUser(parsed.data);
  if (!result.ok) return describeCreateOrganizationFailure(result.failure);

  logger.info("organization.created", { userId: user.id });
  redirect(orgDashboardPath(result.slug));
}
