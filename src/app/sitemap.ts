import { ROUTES } from "@/constants/routes";
import { getSiteUrl } from "@/lib/getSiteUrl";

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL(ROUTES.home, getSiteUrl()).toString(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
