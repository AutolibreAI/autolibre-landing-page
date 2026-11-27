/**
 * Google Tag Manager del lado del navegador: el ID del contenedor, los
 * pedacitos de script inline que monta `app/layout.tsx` y el envío al
 * `dataLayer`. QUÉ se mide lo decide el catálogo único de
 * `lib/analytics/events.ts`; los componentes llaman a `track()`
 * (`lib/analytics/track.ts`), nunca a este módulo directo.
 *
 * Al `dataLayer` llega cada evento del catálogo como
 * `{ event: <nombre en snake_case>, ...props }`, con los mismos props que
 * recibe PostHog. Qué etiquetas disparan con eso se configura en el
 * contenedor, no acá: este código no sabe (ni asume) qué hay adentro.
 *
 * Sin pageview manual en las navegaciones del router: GTM las ve solo con su
 * trigger de History Change (y GA4 con "enhanced measurement"). Empujar uno
 * desde `AnalyticsEvents` las contaría dos veces.
 *
 * Mide en los mismos entornos que el Meta Pixel: donde esté cargada
 * `NEXT_PUBLIC_GTM_ID`, sin corte por `VERCEL_ENV`. Sin la variable (o con un
 * valor que no es un ID de contenedor) no se carga nada y todo es no-op: en
 * dev sin la variable no se ensucian los datos del contenedor real.
 *
 * Si cambia algo de esto, actualizar `lib/content/privacidad.ts`.
 */

/**
 * El ID se interpola en un `<script>` inline y en una URL: sólo se acepta el
 * formato de contenedor. Un valor mal cargado apaga GTM en lugar de terminar
 * como código en el HTML.
 */
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

const rawGtmId = process.env.NEXT_PUBLIC_GTM_ID;

/** Público por diseño: el ID del contenedor viaja igual en el HTML de cualquier sitio. */
export const GTM_ID =
  rawGtmId && GTM_ID_PATTERN.test(rawGtmId) ? rawGtmId : undefined;

/**
 * GTM en dos tiempos, igual que el Meta Pixel (ver `app/layout.tsx`):
 *
 * - `stub`: va inline en el `<head>`. Sólo crea el `dataLayer`, así lo que se
 *   empuja antes de que baje `gtm.js` queda en cola y GTM lo procesa al cargar.
 * - `start` + `src`: los corre el loader diferido del layout (primera
 *   interacción o idle después del `load`). `start` es el arranque del snippet
 *   oficial (`gtm.start` + evento `gtm.js`); `src`, el contenedor.
 *
 * Sin el `<noscript><iframe>` del snippet oficial: con carga diferida por JS no mide nada y mete un iframe en el HTML del server.
 */
export const GTM_SCRIPTS = GTM_ID
  ? {
      stub: "window.dataLayer=window.dataLayer||[];",
      start: `(window.dataLayer=window.dataLayer||[]).push({"gtm.start":Date.now(),event:"gtm.js"});`,
      src: `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`,
    }
  : null;

/** Un push al `dataLayer`: el nombre del evento más props planos, sin objetos anidados. */
export type DataLayerEvent = { event: string } & Record<
  string,
  string | number | boolean
>;

declare global {
  interface Window {
    /** GTM también empuja sus propias entradas (`gtm.start`, `gtm.dom`…). */
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Empuja un evento al `dataLayer`. Si `gtm.js` todavía no bajó, queda en la
 * cola del stub y GTM lo procesa al cargar. No-op en el server y sin
 * `NEXT_PUBLIC_GTM_ID`.
 *
 * Nunca datos personales: acá sólo entra lo que ya pasó por el catálogo.
 * Ojo al configurar el contenedor: el modelo de datos de GTM es persistente,
 * así que un prop de un evento anterior (p. ej. `placement`) sigue visible
 * en uno posterior que no lo trae.
 */
export function pushToDataLayer(entry: DataLayerEvent): void {
  if (!GTM_ID || typeof window === "undefined") return;
  try {
    (window.dataLayer ??= []).push(entry);
  } catch {
    // La medición nunca rompe la página.
  }
}
