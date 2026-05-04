import type { ReactNode } from "react";
type SectionContainerProps = {
  readonly id?: string;
  readonly className?: string;
  readonly children: ReactNode;
};
export default function SectionContainer({ id, className = "", children }: SectionContainerProps) {
  return (
    <section id={id} className={`al-section ${className}`.trim()}>
      <div className="al-container">{children}</div>
    </section>
  );
}
