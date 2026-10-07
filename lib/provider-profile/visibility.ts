/**
 * Interruptor único de la visibilidad pública de los perfiles de proveedor
 * (`/p/<slug>`).
 *
 * Con `false` las páginas siguen deployadas y accesibles por URL directa
 * (para probarlas), pero quedan fuera del alcance de buscadores y de las
 * personas: `noindex`, fuera del sitemap y sin links en el footer. Las tres
 * cosas van juntas a propósito: un `noindex` con la URL en el sitemap manda
 * señales contradictorias, y sacar solo los links deja una página huérfana
 * que Google indexa igual.
 *
 * NO bloquear `/p/` en `robots.ts`: si Google no puede rastrear la página, no
 * llega a leer el `noindex` y la URL puede quedar indexada sin descripción.
 *
 * `public/llms.txt` lista los perfiles a mano: al pasar a `true`, agregar la
 * sección "Perfiles de proveedores"; si se vuelve a `false`, sacarla de ahí
 * también.
 *
 * Se enciende recién al cumplir la puerta de lanzamiento de
 * `specs/209-public-provider-profile/quickstart.md` (§5).
 */
export const PROVIDER_PROFILES_PUBLIC: boolean = false;
