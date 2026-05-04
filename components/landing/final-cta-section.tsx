import Link from "next/link";
import type { LandingPageContent } from "@/lib/landing-types";
import BrandButton from "@/components/landing/brand-button";
import BrandHeading from "@/components/landing/brand-heading";
type FinalCtaSectionProps = {
  readonly content: LandingPageContent["sections"]["finalCta"];
};
export default function FinalCtaSection({ content }: FinalCtaSectionProps) {
  return (
    <div className="al-final-cta">
      <BrandHeading title={content.heading} highlight={content.headingHighlight} description={content.description} />
      <BrandButton asChild>
        <Link href={content.action.href}>{content.action.label}</Link>
      </BrandButton>
    </div>
  );
}
