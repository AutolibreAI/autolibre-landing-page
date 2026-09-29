/**
 * Interruptor único de la visibilidad pública del blog.
 *
 * Con `false` el blog sigue deployado y accesible por URL directa (para
 * probarlo en producción), pero queda fuera del alcance de usuarios y
 * buscadores: páginas con `noindex`, fuera del sitemap y sin links en el
 * header ni en el footer. Las tres cosas van juntas a propósito: un
 * `noindex` con la URL en el sitemap manda señales contradictorias, y
 * sacar solo los links deja una página huérfana que Google indexa igual.
 *
 * NO bloquear `/blog` en `robots.ts`: si Google no puede rastrear la página,
 * no llega a leer el `noindex` y la URL puede quedar indexada sin descripción.
 *
 * Al publicarlo: pasar a `true`, sumar `/blog` a `public/llms.txt` y pedir
 * la indexación desde Search Console.
 */
export const BLOG_PUBLIC: boolean = false;
