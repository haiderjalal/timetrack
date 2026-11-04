import type { NextConfig } from "next";

import { getSecurityHeaders } from "./src/lib/security/securityHeaders";

const securityHeaders = getSecurityHeaders({
  isDevelopment: process.env.NODE_ENV === "development",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
});

const nextConfig: NextConfig = {
  // Static shell + streamed dynamic data (docs/architecture.md §7).
  cacheComponents: true,
  partialPrefetching: true,
  // Links and redirects to routes that don't exist fail the type check.
  typedRoutes: true,
  poweredByHeader: false,
  images: {
    // AVIF is smaller than WebP. WebP stays as the fallback for browsers without AVIF.
    formats: ["image/avif", "image/webp"],
    // Google profile photos only; must match toCurrentUser's avatar host check.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
