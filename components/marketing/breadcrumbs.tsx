import Link from "next/link";

export type Crumb = { readonly name: string; readonly path: string };

/**
 * Migas de pan del rediseño 2026-11 (directorio y perfil de proveedor). Salen
 * de la MISMA lista que `breadcrumbSchema`, así lo que se ve y lo que lee
 * Google no divergen. La última es la página actual (texto con
 * `aria-current`); las demás, links de 44px de alto con subrayado.
 *
 * Contraste: `fg-muted` sobre `card`/`canvas`/`brand-50` (9.16:1 o más). La
 * versión del blog usa `ink/60` y falla AA: no se reusó.
 */
export function Breadcrumbs({ items, label }: { readonly items: readonly Crumb[]; readonly label: string }) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-x-2 text-sm text-fg-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-2">
              {isLast ? (
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
                  <span aria-hidden="true">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
