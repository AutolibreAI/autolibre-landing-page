import type { Metadata } from "next";
import { connection } from "next/server";
import { ProveedoresPageView } from "@/components/proveedores/proveedores-page";
import { providersDirectoryContent } from "@/lib/content/providers-directory";
import { loadDirectory } from "@/lib/proveedores/directory";
import { PROVEEDORES_PATH } from "@/lib/proveedores/query";
import { createMetadata } from "@/lib/seo/metadata";

const { title, description } = providersDirectoryContent.meta;

/**
 * Canonical `/proveedores` para la base y para TODAS las variantes con
 * filtros (que sirve `app/proveedores-filtros`): son recortes del mismo
 * directorio, no páginas con tema propio. Indexables a propósito: un
 * `noindex` con canonical a otra URL son dos señales que se contradicen, y
 * `createMetadata` ata `follow` a `index`.
 */
export const metadata: Metadata = createMetadata({ title, description, path: PROVEEDORES_PATH });

/**
 * Estática con revalidación (ISR): la página base no lee `searchParams` (eso
 * la volvería dinámica, `page.md` › searchParams), así que se genera una vez
 * y sale del CDN; se regenera a lo sumo cada hora, el mismo período que el
 * Data Cache del directorio. Las URLs con filtros las reescribe
 * `next.config.ts` a `app/proveedores-filtros` ANTES de llegar acá.
 */
export const revalidate = 3600;

/** `/proveedores`: el directorio de los negocios de la red, sin filtros. */
export default async function ProveedoresPage() {
  const data = await loadDirectory(null);

  // Sin el directorio, el render degradado (estado de error) NO puede quedar
  // en el cache una hora. Mismo recurso que `/proveedores/registro`: al
  // regenerar en segundo plano, `connection()` hace fallar la regeneración y
  // Next sigue sirviendo la última versión buena; en el build con el backend
  // caído, la ruta queda dinámica para ese deploy (el build no falla) y cada
  // visita se recupera sola apenas vuelve el backend.
  if (data.result === null) await connection();

  return <ProveedoresPageView data={data} />;
}
