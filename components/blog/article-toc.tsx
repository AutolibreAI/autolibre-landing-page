import type { TocItem } from "@/lib/hygraph/toc";

type ArticleTocProps = {
  readonly items: readonly TocItem[];
};

/**
 * Tabla de contenidos del artículo, en las dos variantes del diseño: una
 * lista fija para el sidebar sticky de desktop y un `<details>` nativo para
 * mobile (sin JS: el disclosure es del browser). El artículo elige cuál
 * mostrar con Tailwind (`hidden lg:block` / `lg:hidden`), no hay dos
 * componentes separados para no duplicar el recorrido de `items`.
 */
export function ArticleTocDesktop({ items }: ArticleTocProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="En esta nota" className="flex flex-col gap-3">
      <p className="text-[0.8125rem] font-semibold tracking-[0.06em] text-ink/50 uppercase">
        En esta nota
      </p>
      <ol className="flex flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="flex items-baseline gap-3 py-1.5 text-[0.9375rem] leading-snug text-ink/70 transition-colors hover:text-brand-hover"
            >
              <span
                aria-hidden="true"
                className="size-[0.375rem] shrink-0 translate-y-[-0.15rem] rounded-full bg-brand-soft"
              />
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ArticleTocMobile({ items }: ArticleTocProps) {
  if (items.length === 0) return null;

  return (
    <details className="rounded-panel border border-line px-4">
      <summary className="flex min-h-13 cursor-pointer items-center justify-between gap-3 text-[0.9375rem] font-semibold text-ink">
        En esta nota
        <span className="text-[0.8125rem] font-normal text-ink/50">
          {items.length} {items.length === 1 ? "sección" : "secciones"}
        </span>
      </summary>
      <ol className="flex flex-col pb-2">
        {items.map((item) => (
          <li key={item.id} className="border-t border-line">
            <a
              href={`#${item.id}`}
              className="flex min-h-11 items-center text-[0.9375rem] text-ink"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
