import {
  ANALYTICS_CATALOG,
  type AnalyticsEventName,
  type AnalyticsEventProps,
  type AnalyticsProps,
} from "./events";
import { sendMetaEvent } from "./meta-pixel";
import { capturePostHog } from "./posthog";

/**
 * UN solo punto de medición en el navegador: manda el evento del catálogo a
 * PostHog y a su equivalente de Meta, a los que estén (cada uno es no-op sin
 * su variable de entorno). Nunca rompe la página ni bloquea: PostHog encola
 * hasta cargar y el stub de Meta encola hasta que baja `fbevents.js`.
 *
 * - PostHog recibe todos los props, salvo los eventos que manda el server
 *   (`posthog: "server"` en el catálogo): esos acá sólo van a Meta.
 * - Meta recibe sólo los params que declara el catálogo para ese evento.
 * - `metaEventId`: el `eventID` compartido con la Conversions API. Sólo para
 *   el `Lead` de `quote_submitted` (ver `createMetaEventId`).
 */
export function track<E extends AnalyticsEventName>(
  event: E,
  props?: AnalyticsEventProps[E],
  options?: { metaEventId?: string },
): void {
  trackUnchecked(event, props as AnalyticsProps | undefined, options);
}

/**
 * `track` sin el tipado por evento: para el listener delegado, que arma los
 * props desde atributos `data-*` ya validados contra el catálogo.
 */
export function trackUnchecked(
  event: AnalyticsEventName,
  props?: AnalyticsProps,
  options?: { metaEventId?: string },
): void {
  const entry = ANALYTICS_CATALOG[event];
  const cleanProps = props ? withoutUndefined(props) : undefined;

  if (entry.posthog === "client") capturePostHog(event, cleanProps);

  const meta = entry.meta(cleanProps ?? {});
  if (!meta) return;
  const metaParams = cleanProps ? pick(cleanProps, meta.params) : undefined;
  sendMetaEvent(meta.name, {
    custom: meta.custom,
    params: metaParams,
    eventId: meta.custom ? undefined : options?.metaEventId,
  });
}

function withoutUndefined(props: AnalyticsProps): AnalyticsProps {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  );
}

/** Sólo las claves pedidas; `undefined` si no queda ninguna (Meta sin params). */
function pick(
  props: AnalyticsProps,
  keys: readonly string[],
): AnalyticsProps | undefined {
  const picked = Object.fromEntries(
    Object.entries(props).filter(([key]) => keys.includes(key)),
  );
  return Object.keys(picked).length > 0 ? picked : undefined;
}
