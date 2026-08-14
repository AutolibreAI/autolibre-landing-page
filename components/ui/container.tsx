import { cn } from "@/lib/utils";

type ContainerProps = {
  readonly children: React.ReactNode;
  readonly className?: string;
  /** Ancho máximo del contenido, sin contar el padding lateral. */
  readonly size?: "narrow" | "prose" | "content" | "wide" | "full";
};

const sizes = {
  narrow: "max-w-[720px]", // texto centrado, párrafos largos
  prose: "max-w-[880px]", // FAQ y documentos legales
  content: "max-w-[1280px]", // grillas y contenido general
  wide: "max-w-[1440px]", // hero, header, footer, bandas
  full: "max-w-none",
} as const;

/**
 * Centra el contenido y aplica el padding lateral del diseño (6% del ancho
 * de la ventana).
 *
 * El padding va en el elemento de afuera y el `max-width` en el de adentro,
 * a propósito: si se combinan en el mismo nodo, el 6% se calcula sobre el
 * max-width en vez de sobre el viewport y el contenido queda angosto.
 */
export function Container({
  children,
  className,
  size = "content",
}: ContainerProps) {
  return (
    <div className="w-full px-[6%]">
      <div className={cn("mx-auto w-full", sizes[size], className)}>
        {children}
      </div>
    </div>
  );
}
