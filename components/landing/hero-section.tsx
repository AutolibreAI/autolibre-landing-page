import Link from "next/link";
import type { LandingPageContent } from "@/lib/landing-types";
import BrandButton from "@/components/landing/brand-button";
import BrandHeading from "@/components/landing/brand-heading";
import HeroCarousel from "@/components/landing/hero-carousel";

type HeroSectionProps = {
  readonly content: LandingPageContent["sections"]["hero"];
};

const PROOF_INITIALS = ["MR", "CA", "LF", "AG", "+96"] as const;

export default function HeroSection({ content }: HeroSectionProps) {
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
            {PROOF_INITIALS.map((initial, index) => (
              <span key={initial} style={{ zIndex: PROOF_INITIALS.length - index }}>
                {initial}
              </span>
            ))}
          </div>
          <p>{content.socialProof}</p>
        </div>
      </div>

      {/* Right column — app preview carousel */}
      <div className="al-hero-preview">
        <HeroCarousel />
      </div>
    </div>
  );
}
