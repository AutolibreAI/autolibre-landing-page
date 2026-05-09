import { Plug, AlertTriangle } from "lucide-react";
import type { LandingPageContent } from "@/lib/landing-types";
import BrandHeading from "@/components/landing/brand-heading";

type ProblemSectionProps = {
  readonly content: LandingPageContent["sections"]["problem"];
};

const iconMap: Record<string, React.ReactNode> = {
  plug: <Plug size={24} aria-hidden />,
  alert: <AlertTriangle size={24} aria-hidden />,
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

      <ul className="al-problem-list">
        {content.items.map((item) => (
          <li key={item.id} className="al-problem-item">
            <span className="al-problem-icon">
              {iconMap[item.icon] || <Plug size={24} aria-hidden />}
            </span>
            <p>{item.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
