import { cn } from "@/lib/utils";

type ProfileCardProps = {
  /** `id` del título: la sección lo referencia con `aria-labelledby`. */
  readonly id: string;
  readonly title: string;
  /** `id` de la sección, para enlazarla (p. ej. `resenas`). */
  readonly sectionId?: string;
  /** Nivel del título según el outline de la página (no según su tamaño). */
  readonly as?: "h2" | "h3";
  readonly className?: string;
  readonly children: React.ReactNode;
};

/**
 * Tarjeta de una sección del perfil de proveedor: borde de 1px, sin sombras,
 * radio de 16. Es un primitivo compartido (`components/ui/`): las secciones de
 * `sections/provider-profile/` no se importan entre sí.
 */
export function ProfileCard({
  id,
  title,
  sectionId,
  as: Heading = "h2",
  className,
  children,
}: ProfileCardProps) {
  return (
    <section
      id={sectionId}
      aria-labelledby={id}
      className={cn(
        "scroll-mt-24 rounded-2xl border border-card-line bg-card p-5 md:p-6",
        className,
      )}
    >
      <Heading id={id} className="font-display text-xl font-bold text-ink">
        {title}
      </Heading>
      {children}
    </section>
  );
}
