import type { Metadata } from "next";
import { connection } from "next/server";
import { PageShell } from "@/components/layout/page-shell";
import { RegisterFormGate } from "@/components/proveedores/registro/register-form-gate";
import { Section } from "@/components/ui/section";
import { fetchServiceCatalog } from "@/lib/autolibre-api";
import { providersContent } from "@/lib/content/providers";
import { PROVEEDORES_REGISTRO_FORMULARIO_PATH } from "@/lib/proveedores/query";
import { createMetadata } from "@/lib/seo/metadata";

const PATH = PROVEEDORES_REGISTRO_FORMULARIO_PATH;
const content = providersContent.formPage;

/**
 * Pantalla privada (spec 212, US3): `noindex, nofollow`, fuera de
 * `app/sitemap.ts` y de `public/llms.txt`, SIN `Disallow` en `app/robots.ts`
 * (impediría ver el noindex) y sin JSON-LD (211 D8). El contenido citable del
 * alta vive en `/proveedores/registro`.
 */
export const metadata: Metadata = createMetadata({
  title: content.meta.title,
  description: content.meta.description,
  path: PATH,
  index: false,
});

/**
 * El catálogo se lee acá, en el servidor, y no dentro del formulario: la URL
 * del backend es server-side (sin `NEXT_PUBLIC_`), así que un fetch desde el
 * cliente obligaría a abrir una ruta proxy nueva solo para leer una lista
 * pública. Resolviéndolo en el render la página sigue siendo estática (ISR, al
 * ritmo del `revalidate` del catálogo), el formulario nace con sus opciones
 * puestas y no hay un estado de carga que mantener. La sesión la resuelve el
 * browser (la isla), así que esto no depende de quién mira.
 */
export default async function ProveedoresRegistroFormularioPage() {
  // El catálogo cruza ENTERO al cliente, familias y rubros: el formulario
  // agrupa por familia pero lo que se marca (y lo que se manda) son rubros.
  // Ver `ServiceFamilyOption`.
  const catalog = await fetchServiceCatalog();

  // Sin catálogo, el render degradado NO puede quedar en el cache ISR un día
  // entero. `connection()` le pide a Next un render por request, y eso se
  // resuelve distinto según cuándo pase:
  // - al regenerar en segundo plano, una página que era estática no puede
  //   volverse dinámica ("static to dynamic at runtime"): la regeneración falla
  //   y Next sigue sirviendo la última versión buena (ver
  //   `incremental-static-regeneration.md` › Handling uncaught exceptions), y
  //   reintenta en el request siguiente;
  // - en el build con el backend caído, la ruta queda dinámica para ese deploy
  //   (el build no falla) y cada visita ve el formulario completo apenas el
  //   backend vuelve.
  // Un `throw` no sirve acá: rompe el build, y perder un negocio que se anota
  // es peor que mostrarle el formulario degradado.
  if (catalog === null) await connection();
  const serviceFamilies = catalog ?? [];

  return (
    <PageShell currentPath={PATH}>
      <Section tone="muted" spacing="md" container="narrow" aria-labelledby="formulario-titulo">
        <h1 id="formulario-titulo" className="font-display text-3xl font-bold text-ink md:text-4xl">
          {content.title}
        </h1>
        <p className="mt-4 mb-10 text-lead leading-relaxed text-ink/70">{content.intro}</p>
        <RegisterFormGate serviceFamilies={serviceFamilies} selfPath={PATH} />
      </Section>
    </PageShell>
  );
}
