import type { ReactNode } from "react";
type BrandCardProps = {
  readonly className?: string;
  readonly children: ReactNode;
};
export default function BrandCard({ className = "", children }: BrandCardProps) {
  return <article className={`al-card ${className}`.trim()}>{children}</article>;
}
