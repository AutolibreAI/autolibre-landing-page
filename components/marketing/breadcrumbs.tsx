import Link from "next/link";

export type Crumb = { readonly name: string; readonly path: string };

type BreadcrumbsProps = {
  /** Del inicio en adelante, en orden. */
  readonly items: readonly Crumb[];
  readonly label: string;
  /**
   * `true` (default) si la última miga es la página actual: texto con
   * `aria-current`. En la nota del blog va `false`: las migas terminan en la
   * categoría (el título ya es el `h1` justo debajo) y todas son links.
   */
  readonly endsAtCurrent?: boolean;
};

/**
 * Migas de pan del rediseño 2026-11 (directorio, perfil de proveedor, blog).
 * Salen de la MISMA lista que `breadcrumbSchema`, así lo que se ve y lo que
 * lee Google no divergen. Los links miden 44px de alto, con subrayado.
 *
 * Contraste: `fg-muted` sobre `card`/`canvas`/`brand-50` (9.16:1 o más).
 */
export function Breadcrumbs({ items, label, endsAtCurrent = true }: BreadcrumbsProps) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-x-2 text-sm text-fg-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-2">
              {isLast && endsAtCurrent ? (
                <span aria-current="page" className="font-medium text-fg">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link
                    href={item.path}
                    className="flex min-h-11 items-center underline underline-offset-4 transition-colors hover:text-fg motion-reduce:transition-none"
                  >
                    {item.name}
                  </Link>
                  {isLast ? null : <span aria-hidden="true">/</span>}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
