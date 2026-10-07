import Link from "next/link";
import { providerProfileContent as copy } from "@/lib/content/provider-profile";
import type { Crumb } from "@/lib/provider-profile/present";

/**
 * Migas visibles: "Proveedores › Localidad › Rubro › Nombre". Reciben la MISMA
 * lista que el `BreadcrumbList` (`profileTrail`), así lo visible y lo declarado
 * no pueden divergir. El último paso es la página actual y no es un link.
 */
export function Breadcrumb({ trail }: { readonly trail: readonly Crumb[] }) {
  return (
    <nav aria-label={copy.breadcrumb.label} className="pb-3 md:pb-4">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/65">
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-2">
              {last ? (
                <span aria-current="page" className="font-semibold text-ink">
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link
                    href={crumb.path}
                    className="inline-flex min-h-8 items-center underline-offset-4 hover:text-brand-hover hover:underline"
                  >
                    {crumb.name}
                  </Link>
                  <span aria-hidden="true">›</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
