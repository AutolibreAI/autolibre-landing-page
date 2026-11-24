import { cn } from "@/lib/utils";

type CardProps = {
  readonly children: React.ReactNode;
  readonly className?: string;
  /**
   * - `surface` (AutoLibre AI, vigente): superficie `card` con borde de 1px
   *   `card-line`, sin sombra. Es la que se usa en código nuevo.
   * - `outline`, `solid`, `elevated`: sistema anterior (deprecado). `outline`
   *   = borde fino sobre blanco; `solid` = blanco sin borde; `elevated` =
   *   superficie suave con sombra.
   */
  readonly variant?: "surface" | "outline" | "solid" | "elevated";
  /** Radio: `md` 16px (default), `lg` 20px, `xl` 24px. */
  readonly radius?: "md" | "lg" | "xl";
  /**
   * Elemento a renderizar. Una `section` necesita su heading y el
   * `aria-labelledby` (eso lo pone el consumidor).
   */
  readonly as?: "div" | "article" | "li" | "section" | "aside";
};

const variants = {
  surface: "border border-card-line bg-card",
  outline: "border border-line bg-surface",
  solid: "bg-surface",
  elevated: "bg-surface-subtle shadow-[0_20px_50px_rgba(28,43,28,0.10)]",
} as const;

const radii = {
  md: "rounded-card",
  lg: "rounded-panel",
  xl: "rounded-3xl",
} as const;

/** Forma y fondo de una tarjeta. El padding lo decide el consumidor. */
export function Card({
  children,
  className,
  variant = "outline",
  radius = "md",
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag className={cn(radii[radius], variants[variant], className)}>
      {children}
    </Tag>
  );
}
