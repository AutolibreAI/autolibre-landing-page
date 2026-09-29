import { ArticleTocActive } from "@/components/blog/article-toc-active";
import { blogContent } from "@/lib/content/blog";
import type { TocItem } from "@/lib/hygraph/toc";

type ArticleTocProps = {
  readonly items: readonly TocItem[];
};

/**
 * Tabla de contenidos del artículo, en las dos variantes del diseño: una
 * lista fija para el sidebar sticky de desktop y un `<details>` nativo para
 * mobile (sin JS: el disclosure es del browser). El artículo elige cuál
 * mostrar con Tailwind (`hidden lg:block` / `lg:hidden`).
 *
 * La lista es HTML del server; la isla `ArticleTocActive` solo le agrega el
 * marcador de la sección que se está leyendo. Sin JS, el índice funciona igual.
 */
export function ArticleTocDesktop({ items }: ArticleTocProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-labelledby="toc-titulo" className="flex flex-col gap-3">
      <p id="toc-titulo" className="text-label font-semibold tracking-wider text-ink/60 uppercase">
        {blogContent.article.tocTitle}
      </p>
      <ol className="flex flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              data-toc-link={item.id}
              className="group flex items-baseline gap-3 py-1.5 text-[0.9375rem] leading-snug text-ink/70 transition-colors hover:text-ink aria-[current=location]:font-semibold aria-[current=location]:text-ink"
            >
              <span
                aria-hidden="true"
                className="size-2 shrink-0 -translate-y-0.5 rounded-full bg-line transition-colors group-aria-[current=location]:bg-brand"
              />
              {item.text}
            </a>
          </li>
        ))}
      </ol>
      <ArticleTocActive ids={items.map((item) => item.id)} />
    </nav>
  );
}

export function ArticleTocMobile({ items }: ArticleTocProps) {
  if (items.length === 0) return null;

  return (
    <details className="rounded-panel border border-line px-4">
      <summary className="flex min-h-13 items-center justify-between gap-3 text-[0.9375rem] font-semibold text-ink">
        {blogContent.article.tocTitle}
        <span className="text-label font-normal text-ink/60">
          {blogContent.article.tocCount(items.length)}
        </span>
      </summary>
      <ol className="flex flex-col pb-2">
        {items.map((item) => (
          <li key={item.id} className="border-t border-line">
            <a href={`#${item.id}`} className="flex min-h-11 items-center text-[0.9375rem] text-ink">
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
