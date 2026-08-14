import { cn } from "@/lib/utils";

type CardProps = {
  readonly children: React.ReactNode;
  readonly className?: string;
  /** `outline` = borde fino sobre blanco. `solid` = superficie elevada. */
  readonly variant?: "outline" | "solid" | "elevated";
  readonly as?: "div" | "article" | "li";
};

const variants = {
  outline: "border border-line bg-surface",
  solid: "bg-surface",
  elevated: "bg-surface-subtle shadow-[0_20px_50px_rgba(28,43,28,0.10)]",
} as const;

export function Card({
  children,
  className,
  variant = "outline",
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag className={cn("rounded-card", variants[variant], className)}>
      {children}
    </Tag>
  );
}
