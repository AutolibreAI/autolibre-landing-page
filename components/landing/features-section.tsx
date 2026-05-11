import BrandCard from "@/components/landing/brand-card";
import BrandHeading from "@/components/landing/brand-heading";
import { Bell, Brain, ClipboardList, History } from "lucide-react";

type FeaturesSectionProps = {
  readonly content: {
    tag: string;
    heading: string;
    headingHighlight: string;
    items: Array<{
      id: string;
      icon: string;
      title: string;
      description: string;
    }>;
  };
};

const iconMap: Record<string, React.ReactNode> = {
  brain: <Brain size={28} aria-hidden />,
  history: <History size={28} aria-hidden />,
  bell: <Bell size={28} aria-hidden />,
  clipboard: <ClipboardList size={28} aria-hidden />,
};

export default function FeaturesSection({ content }: FeaturesSectionProps) {
  return (
    <div className="al-features-content">
      <BrandHeading
        eyebrow={content.tag}
        title={content.heading}
        highlight={content.headingHighlight}
        centered
      />

      <div className="al-features-grid">
        {content.items.map((feature) => (
          <BrandCard key={feature.id} className="al-feature-card">
            <span className="al-feature-icon">
              {iconMap[feature.icon] || <Brain size={28} aria-hidden />}
            </span>
            <h3>{feature.title}</h3>
            <p className="al-paragraph-sm">{feature.description}</p>
          </BrandCard>
        ))}
      </div>
    </div>
  );
}
