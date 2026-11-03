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
  poweredByHeader: false,
  images: {
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
