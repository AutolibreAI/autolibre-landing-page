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
  const initials = useMemo(
    (): readonly string[] => ["MR", "CA", "LF", "AG", "+96"],
    [],
  );

  return (
    <div className="al-hero-split">
      {/* Left column — copy */}
      <div className="al-hero-copy">
        <BrandHeading
          eyebrow={content.eyebrow}
          title={content.headingLineOne}
          highlight={content.headingLineTwo}
          description={content.description}
          highlightOnNewLine
        />

        <div className="al-hero-actions al-hero-actions--left">
          <BrandButton asChild>
            <Link href={content.mainAction.href}>
              {content.mainAction.label}
            </Link>
          </BrandButton>
          <BrandButton asChild className="al-button-secondary">
            <Link href={content.secondaryAction.href}>
              {content.secondaryAction.label}
            </Link>
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
          {content.socialProof.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>

      {/* Right column — app preview image */}
      <div className="al-hero-preview" aria-hidden="true">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/app%20sin%20fondo%20HD.png-den0XAYw6LBc5IeDq0PPsTFQaL9FM1.jpeg"
          alt=""
          className="al-preview-image"
        />
      </div>
    </div>
  );
}
