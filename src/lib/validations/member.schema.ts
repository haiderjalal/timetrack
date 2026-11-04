import { z } from "zod";

import { INVITABLE_ROLES } from "./invitation.schema";

export const changeMemberRoleSchema = z.object({
  userId: z.uuid({ message: "Choose someone on the team." }),
  role: z.enum(INVITABLE_ROLES, { message: "Choose admin or member." }),
});

export const deactivateMemberSchema = z.object({
  userId: z.uuid({ message: "Choose someone on the team." }),
});

export type ChangeMemberRoleInput = z.infer<typeof changeMemberRoleSchema>;
