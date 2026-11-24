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

/**
 * `/cuenta?salir=1`: cierra la sesión y vuelve al inicio. Es el "Cerrar
 * sesión" del menú de cuenta del header público, que no carga Clerk y no
 * puede cerrarla él mismo (lo hace `AccountPanel`, que sí tiene Clerk).
 */
export const ACCOUNT_SIGN_OUT_PARAM = "salir";
export const ACCOUNT_SIGN_OUT_PATH = `${ACCOUNT_PATH}?${ACCOUNT_SIGN_OUT_PARAM}=1`;
