"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { LandingPageContent } from "@/lib/landing-types";
import BrandButton from "@/components/landing/brand-button";
import BrandHeading from "@/components/landing/brand-heading";

type HeroSectionProps = {
  readonly content: LandingPageContent["sections"]["hero"];
};

export default function HeroSection({ content }: HeroSectionProps) {
  const initials = useMemo((): readonly string[] => ["MR", "CA", "LF", "AG", "+496"], []);

  return (
    <div className="al-hero-centered">
      <BrandHeading
        eyebrow={content.eyebrow}
        title={content.headingLineOne}
        highlight={content.headingLineTwo}
        description={content.description}
        centered
      />

      <div className="al-hero-actions">
        <BrandButton asChild>
          <Link href={content.mainAction.href}>{content.mainAction.label}</Link>
        </BrandButton>
        <BrandButton asChild className="al-button-secondary">
          <Link href={content.secondaryAction.href}>{content.secondaryAction.label}</Link>
        </BrandButton>
      </div>

      <div className="al-proof al-proof-centered">
        <div className="al-proof-stack">
          {initials.map((initial, index) => (
            <span key={initial} style={{ zIndex: initials.length - index }}>
              {initial}
            </span>
          ))}
        </div>
        <p>{content.socialProof}</p>
      </div>
    </div>
  );
}
