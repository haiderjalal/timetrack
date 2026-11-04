/** What the sender needs. Null when either value is missing, so nothing is sent. */
export interface EmailSettings {
  apiKey: string;
  from: string;
}

export function getEmailSettings(
  env: Record<string, string | undefined>,
): EmailSettings | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.EMAIL_FROM?.trim();

  if (!apiKey || !from) return null;
  return { apiKey, from };
}
