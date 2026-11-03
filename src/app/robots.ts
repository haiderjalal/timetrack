import { getSiteUrl } from "@/lib/getSiteUrl";

import type { MetadataRoute } from "next";

// Signed-in areas and APIs never belong in search results.
const PRIVATE_PATHS = [
  "/o/",
  "/api/",
  "/invite/",
  "/onboarding",
  "/account",
  "/auth/",
];

export default function robots(): MetadataRoute.Robots {
  // Keep Vercel preview deployments out of search indexes.
  const isIndexable = (process.env.VERCEL_ENV ?? "production") === "production";

  if (!isIndexable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    sitemap: new URL("/sitemap.xml", getSiteUrl()).toString(),
  };
}
