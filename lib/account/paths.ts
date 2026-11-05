/**
 * `/cuenta`: "Mi cuenta" de los talleres. Ruta plana y FUERA de
 * `/proveedores` a propósito: así no compite con `/proveedores/[slug]` y no
 * hace falta reservar un slug más en el backend (ver `RESERVED_PROFILE_SLUGS`
 * en `lib/proveedores/query.ts`).
 *
 * Privada: `noindex`, fuera de `app/sitemap.ts` y de `public/llms.txt`, y SIN
 * `Disallow` en `app/robots.ts` (como `/proveedores/contratar`: un Disallow
 * impediría que el crawler vea el noindex).
 */
export const ACCOUNT_PATH = "/cuenta";
