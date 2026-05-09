import Link from "next/link";
import { Zap } from "lucide-react";
import type { LandingPageContent } from "@/lib/landing-types";
import BrandButton from "@/components/landing/brand-button";

type LandingFooterProps = {
  readonly brand: LandingPageContent["brand"];
  readonly content: LandingPageContent["sections"]["footer"];
};

export default function LandingFooter({ brand, content }: LandingFooterProps) {
  return (
    <footer id="footer" className="al-footer-section">
      <div className="al-footer-closing">
        <p className="al-footer-phrase">{content.closingPhrase}</p>
        <BrandButton asChild className="al-footer-cta">
          <Link href={content.secondaryCta.href}>{content.secondaryCta.label}</Link>
        </BrandButton>
      </div>

      <div className="al-footer">
        <div className="al-footer-brand">
          <span className="al-footer-icon">
            <Zap size={12} aria-hidden />
          </span>
          <span>
            {content.legalLabel} &copy; {brand.year}
          </span>
        </div>
        <nav className="al-footer-socials" aria-label="Redes sociales">
          {content.socialLinks.map((link) => (
            <Link key={link.id} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </Link>
          ))}
        </nav>
        <nav className="al-footer-legal" aria-label="Legal">
          {content.legalLinks.map((link) => (
            <Link key={link.label} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
