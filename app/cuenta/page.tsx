import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PageShell } from "@/components/layout/page-shell";
import { AccountPanel } from "@/components/proveedores/account/account-panel";
import { ACCOUNT_PATH, ACCOUNT_SIGN_OUT_PARAM } from "@/lib/account/paths";
import {
  accountSectionHref,
  ACCOUNT_PARTNER_PARAM,
  ACCOUNT_SECTION_PARAM,
  parseAccountPartnerParam,
  parseAccountSection,
} from "@/lib/account/sections";
import { accountHintFromCookies } from "@/lib/auth/role-hint";
import { clerkClientUatCookieName } from "@/lib/auth/session-cookie";
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

type CuentaPageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * `/cuenta`: "Mi negocio" de los talleres (fase 6 del rediseño). La página
 * lee la sección (`?seccion=`), el negocio (`?negocio=`) y el pedido de
 * cerrar sesión (`?salir=1`) y se los pasa a la isla: cada sección es una
 * URL (ver `lib/account/sections.ts`). Una sola isla pinta el `<h1>` en
 * todos los estados.
 */
export default async function CuentaPage({ searchParams }: CuentaPageProps) {
  const params = await searchParams;
  const section = parseAccountSection(params[ACCOUNT_SECTION_PARAM]);
  const partnerId = parseAccountPartnerParam(params[ACCOUNT_PARTNER_PARAM]);
  const signOutRequested = params[ACCOUNT_SIGN_OUT_PARAM] !== undefined;
  // La página ya es dinámica (lee `searchParams`): leer las cookies no cambia
  // su render. La pista elige el esqueleto del primer HTML (sin saltos).
  const sessionCookie = clerkClientUatCookieName();
  const cookieStore = await cookies();
  const accountHint = accountHintFromCookies(sessionCookie, (name) => cookieStore.get(name)?.value);

  return (
    <PageShell currentPath={PATH}>
      <AccountPanel
        selfPath={PATH}
        currentPath={accountSectionHref(PATH, section, partnerId)}
        sessionCookie={sessionCookie}
        accountHint={accountHint}
        section={section}
        requestedPartnerId={partnerId}
        signOutRequested={signOutRequested}
      />
    </PageShell>
  );
}
