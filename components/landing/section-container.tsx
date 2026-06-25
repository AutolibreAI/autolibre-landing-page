import type { ReactNode } from "react";
import ScrollReveal from "@/components/landing/scroll-reveal";
type SectionContainerProps = {
  readonly id?: string;
  readonly className?: string;
  readonly children: ReactNode;
};
export default function SectionContainer({ id, className = "", children }: SectionContainerProps) {
  return (
    <section id={id} className={`al-section ${className}`.trim()}>
      <ScrollReveal className="al-container">{children}</ScrollReveal>
    </section>
  );
}
