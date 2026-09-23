import "server-only";

/**
 * Conversions API de Meta: el mismo evento que manda el Pixel, pero desde el
 * server. Cubre a quien tiene bloqueador o rechaza cookies de terceros, y Meta
 * lo deduplica contra el del navegador por `event_name` + `event_id`.
 *
 * El token es secreto y SIN `NEXT_PUBLIC_`: nunca viaja al bundle. Si falta
 * (o falta el ID del Pixel) no se manda nada, en silencio. Los errores se
 * loguean y se tragan: la medición jamás rompe un pedido de presupuesto.
 */

/** Versión de la Graph API. Se sube a mano cuando Meta depreca la actual. */
const META_GRAPH_API_VERSION = "v23.0";

/** Tope para que un Graph lento no estire la función serverless. */
const META_CAPI_TIMEOUT_MS = 5000;

type MetaCapiEvent = {
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  clientIp?: string;
  userAgent?: string;
  /** Cookie `_fbp` que deja `fbevents.js`: identifica el navegador. */
  fbp?: string;
  /** Cookie `_fbc`: existe si la persona llegó desde un anuncio (`fbclid`). */
  fbc?: string;
};

let warnedMissingToken = false;

export async function sendMetaCapiEvent(event: MetaCapiEvent): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId) return;
  if (!accessToken) {
    if (process.env.NODE_ENV === "development" && !warnedMissingToken) {
      warnedMissingToken = true;
      console.warn("[meta-capi] falta META_CAPI_ACCESS_TOKEN: no se mandan eventos server-side.");
    }
    return;
  }

  // Sólo para "Probar eventos" en el Events Manager: con código, Meta muestra
  // el evento en esa pestaña pero NO lo cuenta como real.
  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();

  // Meta rechaza campos vacíos en `user_data`: sólo van los que existen.
  const userData = Object.fromEntries(
    Object.entries({
      client_ip_address: event.clientIp,
      client_user_agent: event.userAgent,
      fbp: event.fbp,
      fbc: event.fbc,
    }).filter(([, value]) => Boolean(value)),
  );

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [
            {
              event_name: event.eventName,
              event_time: Math.floor(Date.now() / 1000),
              event_id: event.eventId,
              action_source: "website",
              event_source_url: event.eventSourceUrl,
              user_data: userData,
            },
          ],
          ...(testEventCode ? { test_event_code: testEventCode } : {}),
        }),
        signal: AbortSignal.timeout(META_CAPI_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      // El cuerpo de error de Graph no incluye el token; la URL sí, por eso no se loguea.
      const detail = await response.text().catch(() => "");
      console.error(`[meta-capi] ${event.eventName} rechazado (${response.status})`, detail);
    }
  } catch (error) {
    console.error(`[meta-capi] ${event.eventName} no se pudo enviar`, error);
  }
}
