import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  readonly title: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  /** Nivel semántico real. El tamaño se controla con `size`, no con el tag. */
  readonly as?: "h1" | "h2" | "h3";
  readonly size?: "sm" | "md" | "lg" | "display";
  readonly align?: "left" | "center";
  /** `true` cuando va sobre fondo oscuro o verde. */
  readonly onDark?: boolean;
  readonly id?: string;
  readonly className?: string;
};

/**
 * `display` es el escalón de los bloques que abren la home (hero y descarga):
 * trae su propio line-height desde el token. El resto usa 1.15.
 */
const sizes = {
  sm: "text-[1.75rem] leading-[1.15] md:text-[2.125rem]",
  md: "text-[2rem] leading-[1.15] md:text-[2.375rem]",
  lg: "text-[2.25rem] leading-[1.15] md:text-[2.875rem]",
  display:
    "text-display-xs xs:text-display-sm sm:text-display-md lg:text-display-lg",
} as const;

/**
 * Título + bajada de una sección. Separa el nivel semántico (`as`) del
 * tamaño visual (`size`): así la jerarquía de headings queda correcta para
 * SEO aunque el diseño pida un h2 más chico que otro.
 */
export function SectionHeading({
  title,
  subtitle,
  as: Tag = "h2",
  size = "md",
  align = "left",
  onDark = false,
  id,
  className,
}: SectionHeadingProps) {
  const isDisplay = size === "display";

  return (
    <div className={cn(align === "center" && "text-center", className)}>
      <Tag
        id={id}
        className={cn(
          "font-display font-bold",
          sizes[size],
          onDark ? "text-white" : "text-ink",
        )}
      >
        {title}
      </Tag>
      {subtitle ? (
        <p
          className={cn(
            "text-lead leading-relaxed md:text-lead-lg",
            // El display es más grande: la bajada toma más aire y un ancho
            // propio (~50ch) en vez de heredar el del título.
            isDisplay ? "mt-7 max-w-120" : "mt-5",
            onDark ? "text-white/70" : "text-ink/70",
            align === "center" && "mx-auto",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
