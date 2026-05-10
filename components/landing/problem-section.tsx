import { Brain, History, Bell, ClipboardList } from "lucide-react";
import type { LandingPageContent } from "@/lib/landing-types";
import BrandHeading from "@/components/landing/brand-heading";
import BrandCard from "@/components/landing/brand-card";

type ProblemSectionProps = {
  readonly content: LandingPageContent["sections"]["problem"];
};

const iconMap: Record<string, React.ReactNode> = {
  brain: <Brain size={28} aria-hidden />,
  history: <History size={28} aria-hidden />,
  bell: <Bell size={28} aria-hidden />,
  clipboard: <ClipboardList size={28} aria-hidden />,
};

export default function ProblemSection({ content }: ProblemSectionProps) {
  return (
    <div className="al-problem-content">
      <BrandHeading
        eyebrow={content.tag}
        title={content.heading}
        highlight={content.headingHighlight}
        centered
      />

      <p className="al-problem-description">{content.description}</p>

      <p className="al-problem-subtitle">{content.subheading}</p>

      <div className="al-features-grid">
        {content.items.map((item) => (
          <BrandCard key={item.id} className="al-feature-card">
            <span className="al-feature-icon">
              {iconMap[item.icon] || <Brain size={28} aria-hidden />}
            </span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </BrandCard>
        ))}
      </div>
    </div>
  );
}
