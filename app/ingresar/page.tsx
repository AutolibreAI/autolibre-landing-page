import type { Metadata } from "next";
import { SignInScreen } from "@/components/auth/sign-in-screen";
import { SignInWidget } from "@/components/auth/sign-in-widget";
import {
  parseSafeRedirect,
  SIGN_IN_PATH,
  SIGN_IN_REDIRECT_PARAM,
  signInDestinationKind,
  signupIntentForDestination,
} from "@/lib/auth/sign-in-redirect";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { signInIntroFor } from "@/lib/content/sign-in";
import { createMetadata } from "@/lib/seo/metadata";

const { ingresar } = partnerAccountContent;

/**
 * Pantalla privada (como `/cuenta`): `noindex, nofollow`, fuera de
 * `app/sitemap.ts` y de `public/llms.txt`, SIN `Disallow` en `app/robots.ts`
 * (impediría ver el noindex) y sin JSON-LD.
 */
export const metadata: Metadata = createMetadata({
  title: ingresar.meta.title,
  description: ingresar.meta.description,
  path: SIGN_IN_PATH,
  index: false,
});

type IngresarPageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * `/ingresar?redirect=<ruta>`: el login dedicado (2026-11-26). Llegan acá
 * `proxy.ts` (sin sesión en una pantalla privada; con sesión, el proxy
 * devuelve al destino sin renderizar esto) y los CTA del alta. El destino se
 * valida en el server (`parseSafeRedirect`, anti open redirect) y define la
 * bajada y si "Crear cuenta" pregunta cliente o taller.
 */
export default async function IngresarPage({ searchParams }: IngresarPageProps) {
  const destination = parseSafeRedirect((await searchParams)[SIGN_IN_REDIRECT_PARAM]);

  return (
    <SignInScreen intro={signInIntroFor(destination)} showJoin={signInDestinationKind(destination) === "account"}>
      <SignInWidget redirectUrl={destination} signupIntent={signupIntentForDestination(destination)} />
    </SignInScreen>
  );
}
