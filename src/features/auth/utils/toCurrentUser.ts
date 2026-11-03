import type { CurrentUser } from "../types/currentUser";

/** The subset of Supabase JWT claims we read. Everything else is ignored. */
export interface SessionClaims {
  sub: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

// Must match images.remotePatterns in next.config.ts.
const GOOGLE_AVATAR_HOST = "lh3.googleusercontent.com";

export function toCurrentUser(claims: SessionClaims): CurrentUser {
  const metadata = claims.user_metadata ?? {};
  const email = claims.email ?? "";

  return {
    id: claims.sub,
    email,
    name: readString(metadata.full_name) ?? readString(metadata.name) ?? email,
    avatarUrl: readGoogleAvatarUrl(
      readString(metadata.avatar_url) ?? readString(metadata.picture),
    ),
  };
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readGoogleAvatarUrl(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === GOOGLE_AVATAR_HOST
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
