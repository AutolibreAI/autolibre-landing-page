import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  readonly title: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  /** Nivel semántico real. El tamaño se controla con `size`, no con el tag. */
  readonly as?: "h1" | "h2" | "h3";
  readonly size?: "sm" | "md" | "lg";
  readonly align?: "left" | "center";
  /** `true` cuando va sobre fondo oscuro o verde. */
  readonly onDark?: boolean;
  readonly id?: string;
  readonly className?: string;
};

const sizes = {
  sm: "text-[1.75rem] md:text-[2.125rem]",
  md: "text-[2rem] md:text-[2.375rem]",
  lg: "text-[2.25rem] md:text-[2.875rem]",
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
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      <Tag
        id={id}
        className={cn(
          "font-display font-bold leading-[1.15]",
          sizes[size],
          onDark ? "text-white" : "text-ink",
        )}
      >
        {title}
      </Tag>
      {subtitle ? (
        <p
          className={cn(
            "mt-5 text-[1.0625rem] leading-relaxed md:text-[1.1875rem]",
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
