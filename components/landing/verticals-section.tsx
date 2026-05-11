"use client";
import { useState } from "react";
import Image from "next/image";
import type { LandingPageContent } from "@/lib/landing-types";
import BrandCard from "@/components/landing/brand-card";
import BrandHeading from "@/components/landing/brand-heading";
type VerticalsSectionProps = {
  readonly content: LandingPageContent["sections"]["verticals"];
};
export default function VerticalsSection({ content }: VerticalsSectionProps) {
  const [isCardFallbackVisible, setIsCardFallbackVisible] = useState<boolean>(false);
  return (
    <div>
      <BrandHeading eyebrow={content.tag} title={content.heading} highlight={content.headingHighlight} />
      <div className="al-vertical-grid">
        {content.items.map((item) => (
          <BrandCard key={item.id} className="al-vertical-card">
            <div className="al-vertical-meta">
              <span className="al-vertical-emoji">{item.emoji}</span>
              <span className="al-status-chip">{item.status}</span>
            </div>
            <h3>{item.title}</h3>
            <p className="al-paragraph-sm">{item.description}</p>
          </BrandCard>
        ))}
        {!isCardFallbackVisible ? (
          <Image
            className="al-vertical-inline-media"
            src="/landing/roadmap-glow.svg"
            alt="Glow decorativo para seccion de verticales"
            width={1080}
            height={120}
            onError={() => setIsCardFallbackVisible(true)}
          />
        ) : (
          <div className="al-vertical-inline-fallback">Decorative fallback active</div>
        )}
      </div>
    </div>
  );
}
