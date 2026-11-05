import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { AccountPanel } from "@/components/proveedores/account/account-panel";
import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { Section } from "@/components/ui/section";
import { ACCOUNT_PATH } from "@/lib/account/paths";
import { accountContent } from "@/lib/content/account";
import { createMetadata } from "@/lib/seo/metadata";

const PATH = ACCOUNT_PATH;
const { page } = accountContent;

/**
 * Pantalla privada (como `/proveedores/contratar`): `noindex, nofollow`,
 * fuera de `app/sitemap.ts` y de `public/llms.txt`, SIN `Disallow` en
 * `app/robots.ts` (impediría ver el noindex) y sin JSON-LD.
 */
export const metadata: Metadata = createMetadata({
  title: page.meta.title,
  description: page.meta.description,
  path: PATH,
  index: false,
});

/**
 * `/cuenta`: "Mi cuenta" mínimo de los talleres. Server con una sola isla,
 * que pinta el `<h1>` en los dos estados: sin sesión, el login compartido;
 * con sesión, quién sos (con cerrar sesión), tus talleres y el estado de su
 * plan. Sin features nuevas de backend: `GET /partners/me/memberships` y
 * `GET /partners/{id}/subscription`.
 */
export default function CuentaPage() {
  return (
    <PageShell currentPath={PATH}>
      <Section tone="muted" spacing="md" aria-labelledby={PRIVATE_FLOW_TITLE_ID}>
        <AccountPanel selfPath={PATH} />
      </Section>
    </PageShell>
  );
}
