import { Brain, History, Bell, ClipboardList } from "lucide-react";
import type { LandingPageContent } from "@/lib/landing-types";
import BrandHeading from "@/components/landing/brand-heading";

type ProblemSectionProps = {
  readonly content: LandingPageContent["sections"]["problem"];
};

const iconMap: Record<string, React.ReactNode> = {
  brain: <Brain size={24} aria-hidden />,
  history: <History size={24} aria-hidden />,
  bell: <Bell size={24} aria-hidden />,
  clipboard: <ClipboardList size={24} aria-hidden />,
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

      <h3 className="al-problem-subheading">{content.subheading}</h3>

      <ul className="al-problem-list">
        {content.items.map((item) => (
          <li key={item.id} className="al-problem-item">
            <span className="al-problem-icon">
              {iconMap[item.icon] || <Brain size={24} aria-hidden />}
            </span>
            <div className="al-problem-item-content">
              <strong>{item.title}</strong>
              <span> — {item.text}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
