import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProveedoresPageView } from "@/components/proveedores/proveedores-page";
import { providersDirectoryContent } from "@/lib/content/providers-directory";
import { loadDirectory } from "@/lib/proveedores/directory";
import { PROVEEDORES_PATH } from "@/lib/proveedores/query";
import { createMetadata } from "@/lib/seo/metadata";

const { title, description } = providersDirectoryContent.meta;

/**
 * Misma metadata que `/proveedores` (canonical incluido): esta ruta es la
 * MISMA página con filtros. Nadie la enlaza con este nombre: la URL visible es
 * siempre `/proveedores?…` (rewrite de `next.config.ts`) y `robots.ts` la
 * excluye por si alguien la pide directo.
 */
export const metadata: Metadata = createMetadata({ title, description, path: PROVEEDORES_PATH });

type PageProps = {
  readonly searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * `/proveedores?rubro=…&zona=…&q=…&pagina=…`: el directorio con filtros o
 * paginado. Dinámica (lee `searchParams`), pero barata: todos los `fetch` del
 * directorio van al Data Cache (1 h), salvo la búsqueda por nombre (`q`, texto
 * libre: no se cachea). Separada de la página base para que la base siga
 * siendo estática (ver `app/proveedores/page.tsx`).
 *
 * Todo se pide ANTES de renderizar, sin `<Suspense>`: una `?pagina=` fuera de
 * rango responde un 404 de verdad (con streaming el status ya habría salido
 * 200, ver `loading.md` › Status Codes).
 */
export default async function ProveedoresFiltrosPage({ searchParams }: PageProps) {
  const data = await loadDirectory(await searchParams);

  // Fuera de rango es 404 y no la última página con otro número: si no,
  // `?pagina=99` sería una URL duplicada (y hay infinitas). Un rubro sin
  // negocios (`totalPages` 0) igual tiene su página 1: el estado vacío.
  if (data.result && data.filters.pagina > Math.max(1, data.result.totalPages)) notFound();

  return <ProveedoresPageView data={data} />;
}
