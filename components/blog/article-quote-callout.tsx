import { ButtonLink } from "@/components/ui/button";
import { ANALYTICS_EVENTS, QUOTE_CTA_PLACEMENTS } from "@/lib/analytics/events";
import { blogContent } from "@/lib/content/blog";

type ArticleQuoteCalloutProps = {
  /** Slug de la categoría de la nota: elige el título (ver `quoteCallout`). */
  readonly categorySlug: string;
};

/**
 * Llamado a `/pedido` dentro del cuerpo de la nota (lo único nuevo de la nota
 * en el lienzo `BlogNota`). Lo intercala `RichText` antes de las preguntas
 * frecuentes: el lector ya tiene la respuesta y, si su auto necesita algo, el
 * paso siguiente es pedir propuestas.
 *
 * Es un `<aside>` nombrado por su título, que es un `<p>` y no un heading (el
 * lienzo usa `h3`): es un llamado, no una sección de la nota, y puede caer
 * en cualquier lugar del cuerpo (sin `h2` antes, un `h3` saltaría un nivel).
 * Así no toca el outline ni la tabla de contenidos.
 * Borde `action` (14.74:1) sobre `card`, sin sombra.
 */
export function ArticleQuoteCallout({ categorySlug }: ArticleQuoteCalloutProps) {
  const { title, titleByCategory, text, cta } = blogContent.quoteCallout;

  return (
    <aside
      aria-labelledby="nota-pedido"
      className="my-10 flex flex-wrap items-center justify-between gap-x-7 gap-y-4 rounded-card border border-action bg-card p-5.5"
    >
      <div className="min-w-0 flex-[1_1_20rem]">
        <p id="nota-pedido" className="font-display text-xl leading-snug font-bold text-fg">
          {titleByCategory[categorySlug] ?? title}
        </p>
        <p className="mt-1 text-control text-fg-muted">{text}</p>
      </div>
      <ButtonLink
        href="/pedido"
        variant="primary"
        size="52"
        className="max-sm:w-full"
        data-analytics-event={ANALYTICS_EVENTS.quoteCtaClicked}
        data-analytics-quote-placement={QUOTE_CTA_PLACEMENTS.blogArticle}
      >
        {cta}
      </ButtonLink>
    </aside>
  );
}
