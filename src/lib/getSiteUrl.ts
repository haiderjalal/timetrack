const LOCAL_SITE_URL = "http://localhost:3000";

/**
 * Absolute base URL for metadata, canonical links and the sitemap.
 * Falls back to the Vercel deployment URL, then to local development.
 */
export function getSiteUrl(): URL {
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? vercelUrl ?? LOCAL_SITE_URL;

  try {
    return new URL(siteUrl);
  } catch {
    throw new Error(
      `Invalid site URL "${siteUrl}". Check NEXT_PUBLIC_SITE_URL.`,
    );
  }
}
