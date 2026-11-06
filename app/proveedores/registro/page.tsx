import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/page-shell";
import {
  PRIVATE_FLOW_TITLE_ID,
  PrivateFlowHead,
  SignInLayout,
  SignInLoading,
} from "@/components/proveedores/account/private-flow";
import { FlowSteps } from "@/components/proveedores/flow/flow-steps";
import { RegisterFormGate } from "@/components/proveedores/registro/register-form-gate";
import { JsonLd } from "@/components/seo/json-ld";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { fetchServiceCatalog } from "@/lib/autolibre-api";
import { providersContent } from "@/lib/content/providers";
import { PROVEEDORES_PATH, PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";
import { whatsappUrl } from "@/lib/whatsapp";

const { title: TITLE, description: DESCRIPTION } = providersContent.meta;
const PATH = PROVEEDORES_REGISTRO_PATH;
const content = providersContent.registerPage;

/**
 * Indexable, como siempre lo fue `/proveedores/registro` (sitemap y
 * `llms.txt`). Desde el 2026-11-05 la página ES el formulario del alta (antes
 * vivía en `/proveedores/registro/formulario`, que hoy redirige acá con un
 * 301 en `next.config.ts`).
 */
export const metadata: Metadata = createMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

const schema = graph(
  organizationSchema(),
  webPageSchema({ name: TITLE, description: DESCRIPTION, path: PATH }),
  breadcrumbSchema([
    { name: "Inicio", path: "/" },
    { name: "Proveedores", path: PROVEEDORES_PATH },
    { name: content.breadcrumb, path: PATH },
  ]),
);

const linkClass =
  "inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-hover underline-offset-4 hover:underline";

/**
 * `/proveedores/registro`: el alta de talleres. Sin sesión, el login de la
 * cuenta de AutoLibre (con los pasos del registro al costado); con sesión, el
 * formulario.
 *
 * Lo citable se arma acá, en el server: el `<h1>`, la bajada y el aviso para
 * los talleres que ya aparecen (`head`). Un crawler no ve un muro de login
 * vacío. Ese nodo se pasa al layout del login (columna izquierda, arriba de
 * los pasos, alineado con la tarjeta) tanto en el fallback del `<Suspense>`
 * como en la isla; con sesión, la isla lo pinta arriba del formulario. Un nodo
 * server pasado como prop a un client component sigue en el HTML inicial, así
 * que el `<h1>` sale en el HTML en todos los estados. Página pública: el
 * código de reclamo no se nombra.
 *
 * El catálogo se lee acá, en el servidor, y no dentro del formulario: la URL
 * del backend es server-side (sin `NEXT_PUBLIC_`), así que un fetch desde el
 * cliente obligaría a abrir una ruta proxy nueva solo para leer una lista
 * pública. Resolviéndolo en el render la página sigue siendo estática (ISR, al
 * ritmo del `revalidate` del catálogo), el formulario nace con sus opciones
 * puestas y no hay un estado de carga que mantener. La sesión la resuelve el
 * browser (la isla), así que esto no depende de quién mira.
 */
export default async function ProveedoresRegistroPage() {
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

  const { listed } = content;
  // Encabezado de la página. Uno solo, compartido por el fallback y la isla:
  // exactamente un `<h1>` en cada estado.
  const head = (
    <div className="flex flex-col gap-4">
      <PrivateFlowHead head={{ eyebrow: content.eyebrow, title: content.title, intro: content.intro }} />
      {/* Un taller que ya figura no se registra dos veces. */}
      <p className="max-w-150 text-[0.9375rem] leading-relaxed text-ink/72">
        {listed.body}{" "}
        <a
          href={whatsappUrl(listed.whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
          data-analytics-placement="registro_ya_aparece"
          className={linkClass}
        >
          <Icon name="whatsapp" size={18} strokeWidth={1.8} />
          {listed.cta}
        </a>
      </p>
    </div>
  );
  // Contexto del login: qué viene después de entrar (paso 1 = el actual).
  const context = (
    <FlowSteps
      orientation="vertical"
      label={content.steps.label}
      steps={content.steps.items}
      current={0}
    />
  );

  return (
    <>
      <PageShell cta={false} currentPath={PATH}>
        {/* `id="form"`: los links viejos a `/proveedores/registro#form`. */}
        <Section id="form" tone="muted" spacing="md" aria-labelledby={PRIVATE_FLOW_TITLE_ID}>
          {/* La isla lee `?next` (la contratación de la que vino) con
              `useSearchParams`: en una página estática eso exige un
              `<Suspense>` (si no, falla el build). El fallback es el mismo
              login en "cargando" que muestra la isla mientras carga Clerk:
              mismo layout y mismo encabezado, sin salto. */}
          <Suspense
            fallback={
              <SignInLayout headSlot={head} context={context}>
                <SignInLoading />
              </SignInLayout>
            }
          >
            <RegisterFormGate serviceFamilies={serviceFamilies} selfPath={PATH} head={head} context={context} />
          </Suspense>
        </Section>
      </PageShell>

      <JsonLd schema={schema} />
    </>
  );
}
