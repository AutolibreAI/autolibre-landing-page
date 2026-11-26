import { cn } from "@/lib/utils";

/** `id` del `<h1>`: la `<Section>` de cada página privada lo usa en `aria-labelledby`. */
export const PRIVATE_FLOW_TITLE_ID = "flujo-titulo";

export type PrivateFlowHeadContent = {
  /**
   * Rótulo chico arriba del título (un `<p>`, nunca un heading). Opcional:
   * el rediseño va sacando los eyebrows; sin él, solo el `<h1>` y la bajada.
   */
  readonly eyebrow?: string;
  readonly title: string;
  readonly intro: string;
};

/**
 * Encabezado de una pantalla privada de negocios: rótulo, `<h1>` y bajada
 * (sistema AutoLibre AI). Lo pintan las islas (con o sin sesión) para que el
 * `<h1>` esté siempre en el HTML del server.
 */
export function PrivateFlowHead({
  head,
  className,
}: {
  readonly head: PrivateFlowHeadContent;
  readonly className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {head.eyebrow ? (
        <p className="text-sm font-semibold text-brand-hover">{head.eyebrow}</p>
      ) : null}
      <h1
        id={PRIVATE_FLOW_TITLE_ID}
        tabIndex={-1}
        className="font-display text-4xl font-bold tracking-tight text-balance text-fg md:text-5xl"
      >
        {head.title}
      </h1>
      <p className="max-w-160 text-lead text-fg-muted md:text-lead-lg">
        {head.intro}
      </p>
    </div>
  );
}
