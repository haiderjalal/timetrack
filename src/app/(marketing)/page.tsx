import { SITE_DESCRIPTION, SITE_NAME } from "@/constants/site";
import { FeatureGrid } from "@/features/marketing/components/FeatureGrid";
import { HeroSection } from "@/features/marketing/components/HeroSection";
import { HowItWorks } from "@/features/marketing/components/HowItWorks";
import { getSiteUrl } from "@/lib/getSiteUrl";

import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: getSiteUrl().toString(),
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // Static, trusted object; "<" is escaped so the JSON can't close the script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <HeroSection />
      <FeatureGrid />
      <HowItWorks />
    </>
  );
}
