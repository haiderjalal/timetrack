import { randomBytes } from "node:crypto";

import { hashInvitationToken } from "../utils/hashInvitationToken";

/** 32 random bytes: far too many to guess, and 43 URL-safe characters to put in a link. */
const TOKEN_BYTES = 32;

export interface InvitationToken {
  /** Goes only into the invitation email. */
  token: string;
  /** The only form the database keeps. */
  tokenHash: string;
}

export function createInvitationToken(): InvitationToken {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}
