"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Zap, ClipboardList, BellRing, Car } from "lucide-react";
import type { LandingPageContent } from "@/lib/landing-types";
import BrandButton from "@/components/landing/brand-button";
import BrandHeading from "@/components/landing/brand-heading";

type HeroSectionProps = {
  readonly content: LandingPageContent["sections"]["hero"];
};

const APP_PREVIEW_ITEMS = [
  {
    icon: Zap,
    label: "Diagnostico IA",
    value: "Motor: OK",
    sub: "Sin fallas detectadas",
    color: "#00ffff",
  },
  {
    icon: BellRing,
    label: "Proxima VTV",
    value: "23 dias",
    sub: "Recordatorio activado",
    color: "#7eb8ff",
  },
  {
    icon: ClipboardList,
    label: "Historial",
    value: "12 registros",
    sub: "Ultimo: Aceite 05/24",
    color: "#00ffff",
  },
  {
    icon: Car,
    label: "Tu auto",
    value: "VW Vento 2019",
    sub: "AA 123 BB",
    color: "#7eb8ff",
  },
] as const;

export default function HeroSection({ content }: HeroSectionProps) {
  const initials = useMemo((): readonly string[] => ["MR", "CA", "LF", "AG", "+496"], []);

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

      {/* Right column — app preview */}
      <div className="al-hero-preview" aria-hidden="true">
        <div className="al-preview-phone">
          <div className="al-preview-statusbar">
            <span>AutoLibre</span>
            <span className="al-preview-dot" />
          </div>
          <div className="al-preview-grid">
            {APP_PREVIEW_ITEMS.map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="al-preview-card">
                <div className="al-preview-card-icon" style={{ color }}>
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <p className="al-preview-card-label">{label}</p>
                <p className="al-preview-card-value" style={{ color }}>{value}</p>
                <p className="al-preview-card-sub">{sub}</p>
              </div>
            ))}
          </div>
          <div className="al-preview-chat">
            <div className="al-preview-chat-bubble al-preview-chat-bubble--user">
              Tengo una luz amarilla en el tablero
            </div>
            <div className="al-preview-chat-bubble al-preview-chat-bubble--ai">
              <span className="al-preview-ai-label">AutoLibre IA</span>
              Puede ser el sensor de oxigeno. No es urgente, pero te recomiendo revisarlo en los proximos 500 km.
            </div>
          </div>
        </div>
        <div className="al-preview-glow" />
      </div>
    </div>
  );
}
