import { createHash } from "node:crypto";

/**
 * SHA-256 of the token's UTF-8 bytes, as hex. accept_invitation() hashes the
 * same way in SQL (sha256(convert_to(token, 'UTF8'))), so the two must agree.
 */
export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
