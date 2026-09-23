import { Container, type ContainerSize } from "@/components/ui/container";
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
  /**
   * Ancho del contenido. Por defecto `"wide"`: el mismo borde que el header,
   * el hero y el footer. Un ancho menor (`"content"`, `"prose"`, `"narrow"`)
   * es una decisión deliberada de bloque centrado.
   *
   * `false` saca el contenedor y el contenido va de borde a borde. Es la
   * excepción, no una comodidad: solo para bandas o medios full-bleed que
   * manejan su propio gutter, o para secciones que son columnas de una
   * grilla que ya vive dentro de un `Container` (así los bordes externos de
   * la fila siguen alineados con el header).
   */
  readonly container?: ContainerSize | false;
  /** Clases del nodo interno del `Container` (el que tiene el `max-width`). */
  readonly containerClassName?: string;
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
 * Banda horizontal de la página. Controla fondo, ritmo vertical Y el ancho
 * del contenido, para que todas las secciones respiren igual y compartan
 * los bordes del header y el footer sin repetir paddings a mano.
 *
 * Regla: el contenido de una sección SIEMPRE vive dentro de un contenedor.
 * `Section` ya trae `Container size="wide"` por defecto; otro ancho se pide
 * con `container="prose"` (etc.) y sus clases con `containerClassName`.
 * Nunca anides un `Container` a mano dentro de un `Section`: duplica el
 * gutter y rompe la alineación.
 */
export function Section({
  children,
  id,
  tone = "surface",
  spacing = "lg",
  className,
  container = "wide",
  containerClassName,
  ...rest
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(tones[tone], spacings[spacing], className)}
      {...rest}
    >
      {container === false ? (
        children
      ) : (
        <Container size={container} className={containerClassName}>
          {children}
        </Container>
      )}
    </section>
  );
}
