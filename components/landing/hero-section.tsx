"use client";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Sparkles, Zap } from "lucide-react";
import type { LandingPageContent } from "@/lib/landing-types";
import BrandButton from "@/components/landing/brand-button";
import BrandHeading from "@/components/landing/brand-heading";
import BrandCard from "@/components/landing/brand-card";
type HeroSectionProps = {
  readonly content: LandingPageContent["sections"]["hero"];
};
export default function HeroSection({ content }: HeroSectionProps) {
  const [isHeroImageMissing, setIsHeroImageMissing] = useState<boolean>(false);
  const initials = useMemo((): readonly string[] => ["MR", "CA", "LF", "AG", "+496"], []);
  return (
    <div className="al-hero-grid">
      <div className="al-hero-copy">
        <BrandHeading
          eyebrow={content.eyebrow}
          title={content.headingLineOne}
          highlight={content.headingLineTwo}
          description={content.description}
        />
        <div className="al-hero-actions">
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
      <div className="al-hero-preview">
        <BrandCard>
          <div className="al-preview-header">
            <span>Vista previa app</span>
            <Sparkles size={14} aria-hidden />
          </div>
          {!isHeroImageMissing ? (
            <Image
              className="al-preview-image"
              src="/landing/app-preview.svg"
              alt="Vista previa de AutoLibreAI en smartphone"
              width={880}
              height={560}
              onError={() => setIsHeroImageMissing(true)}
            />
          ) : (
            <div className="al-preview-fallback">
              <Zap size={20} aria-hidden />
              <p>Vista previa disponible en la siguiente iteracion de assets.</p>
            </div>
          )}
        </BrandCard>
      </div>
    </div>
  );
}
