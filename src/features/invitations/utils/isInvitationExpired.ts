/** True once the instant has passed. The caller supplies `now`, so the check stays pure. */
export function isInvitationExpired(expiresAt: string, now: Date): boolean {
  return Date.parse(expiresAt) <= now.getTime();
}
