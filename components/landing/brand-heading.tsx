import type { ReactNode } from "react";

type BrandHeadingProps = {
  readonly title: string;
  readonly highlight?: string;
  readonly description?: string | readonly string[];
  readonly eyebrow?: string;
  readonly icon?: ReactNode;
  readonly centered?: boolean;
};

export default function BrandHeading({
  title,
  highlight,
  description,
  eyebrow,
  icon,
  centered,
}: BrandHeadingProps) {
  const renderDescription = () => {
    if (!description) return null;
    if (Array.isArray(description)) {
      return description.map((paragraph, index) => (
        <p key={index} className="al-description">
          {paragraph}
        </p>
      ));
    }
    return <p className="al-description">{description}</p>;
  };

  return (
    <header
      className={`al-heading ${centered ? "al-heading-centered" : ""}`.trim()}
    >
      {eyebrow ? <p className="al-eyebrow">{eyebrow}</p> : null}
      <h2 className="al-title">
        {title}{" "}
        {highlight ? <span className="al-highlight">{highlight}</span> : null}
      </h2>
      {renderDescription()}
      {icon ? <div className="al-heading-icon">{icon}</div> : null}
    </header>
  );
}
