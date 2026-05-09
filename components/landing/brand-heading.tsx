import type { ReactNode } from "react";

type BrandHeadingProps = {
  readonly title: string;
  readonly highlight?: string;
  readonly description?: string;
  readonly eyebrow?: string;
  readonly icon?: ReactNode;
  readonly centered?: boolean;
};

export default function BrandHeading({ title, highlight, description, eyebrow, icon, centered }: BrandHeadingProps) {
  return (
    <header className={`al-heading ${centered ? "al-heading-centered" : ""}`.trim()}>
      {eyebrow ? <p className="al-eyebrow">{eyebrow}</p> : null}
      <h2 className="al-title">
        {title} {highlight ? <span className="al-highlight">{highlight}</span> : null}
      </h2>
      {description ? <p className="al-description">{description}</p> : null}
      {icon ? <div className="al-heading-icon">{icon}</div> : null}
    </header>
  );
}
