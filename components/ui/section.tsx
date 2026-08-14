import { cn } from "@/lib/utils";

type SectionTone = "surface" | "muted" | "ink" | "brand";
type SectionSpacing = "sm" | "md" | "lg";

type SectionProps = {
  readonly children: React.ReactNode;
  readonly id?: string;
  /** Fondo de la sección. El diseño alterna blanco / verde claro. */
  readonly tone?: SectionTone;
  readonly spacing?: SectionSpacing;
  readonly className?: string;
  /** Etiqueta accesible cuando la sección no tiene un heading visible propio. */
  readonly "aria-labelledby"?: string;
};

const tones: Record<SectionTone, string> = {
  surface: "bg-surface text-ink",
  muted: "bg-surface-muted text-ink",
  ink: "bg-ink text-white",
  brand: "bg-brand text-white",
};

const spacings: Record<SectionSpacing, string> = {
  sm: "py-12 md:py-16",
  md: "py-16 md:py-24",
  lg: "py-20 md:py-[7.5rem]",
};

/**
 * Banda horizontal de la página. Controla fondo y ritmo vertical para que
 * todas las secciones respiren igual sin repetir paddings a mano.
 */
export function Section({
  children,
  id,
  tone = "surface",
  spacing = "lg",
  className,
  ...rest
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(tones[tone], spacings[spacing], className)}
      {...rest}
    >
      {children}
    </section>
  );
}
