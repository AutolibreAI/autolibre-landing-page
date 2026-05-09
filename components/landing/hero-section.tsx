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
  const initials = useMemo((): readonly string[] => ["MR", "CA", "LF", "AG", "+96"], []);

  return (
    <div className="al-hero-split">
      {/* Left column — copy */}
      <div className="al-hero-copy">
        <BrandHeading
          eyebrow={content.eyebrow}
          title={content.headingLineOne}
          highlight={content.headingLineTwo}
          description={content.description}
        />

        <div className="al-hero-actions al-hero-actions--left">
          <BrandButton asChild>
            <Link href={content.mainAction.href}>{content.mainAction.label}</Link>
          </BrandButton>
          <BrandButton asChild className="al-button-secondary">
            <Link href={content.secondaryAction.href}>{content.secondaryAction.label}</Link>
          </BrandButton>
        </div>

        <div className="al-proof">
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

      {/* Right column — app preview video */}
      <div className="al-hero-preview" aria-hidden="true">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="al-preview-video"
          poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        >
          <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/preview-GTLBdiPC9BkM8zyEbUHg0n9ejTKiUo.mp4" type="video/mp4" />
          Tu navegador no soporta videos HTML5.
        </video>
        <div className="al-preview-glow" />
      </div>
    </div>
  );
}
