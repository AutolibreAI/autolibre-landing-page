import "server-only";
import { PostHog } from "posthog-node";
import { ANALYTICS_APP, type AnalyticsEventName, type AnalyticsProps } from "./events";

/**
 * PostHog desde el server (`posthog-node`), para los eventos que sólo el
 * backend puede confirmar (hoy: `quote_submitted`, con el pedido ya
 * registrado).
 *
 * - Mismo corte que el navegador: sólo en el deploy de Production de Vercel
 *   (`VERCEL_ENV === "production"`) y con el token público
 *   (`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`). Un pedido de prueba en dev o en un
 *   preview no llega a PostHog.
 * - `POSTHOG_HOST` (sólo server) como host de ingesta, con fallback a la
 *   región US.
 * - Serverless: `captureImmediate` espera el envío HTTP en la misma llamada,
 *   sin cola que se pierda cuando la función se congela. Se llama desde
 *   `after()`, así que no demora la respuesta al usuario.
 * - Los errores se loguean y se tragan: la medición jamás rompe un pedido.
 */

/** Tope para que un PostHog lento no estire la función serverless. */
const POSTHOG_SERVER_TIMEOUT_MS = 5000;

/** IDs que genera `posthog-js` (UUIDv7). Cualquier otra cosa se descarta. */
const POSTHOG_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (process.env.VERCEL_ENV !== "production") return null;
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) return null;
  client ??= new PostHog(token, {
    host: process.env.POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
    requestTimeout: POSTHOG_SERVER_TIMEOUT_MS,
    fetchRetryCount: 1,
    // La IP que vería PostHog es la del server de Vercel, no la de la
    // persona: geolocalizarla daría datos falsos.
    disableGeoip: true,
  });
  return client;
}

/** El ID tal cual si tiene forma de ID de `posthog-js`; si no, `null`. */
export function posthogIdOrNull(raw: unknown): string | null {
  return typeof raw === "string" && POSTHOG_ID_PATTERN.test(raw) ? raw : null;
}

type ServerEvent = {
  event: AnalyticsEventName;
  /** `posthog.get_distinct_id()` del navegador, ya validado. */
  distinctId: string | null;
  /** `posthog.get_session_id()` del navegador, ya validado. */
  sessionId: string | null;
  /** Sin datos personales: ni nombre, ni WhatsApp, ni correo, ni patente. */
  properties: AnalyticsProps;
};

/**
 * Manda un evento server-side unido a la persona y la sesión del navegador
 * (`distinctId` + `$session_id`). Si el navegador no mandó IDs (PostHog
 * bloqueado o sin cargar), sale con un ID al azar y
 * `$process_person_profile: false`: cuenta en los totales sin crear una
 * persona fantasma.
 */
export async function capturePostHogServerEvent({
  event,
  distinctId,
  sessionId,
  properties,
}: ServerEvent): Promise<void> {
  const posthog = getClient();
  if (!posthog) return;

  try {
    await posthog.captureImmediate({
      distinctId: distinctId ?? crypto.randomUUID(),
      event,
      properties: {
        ...properties,
        // La misma super property que registra el navegador.
        app: ANALYTICS_APP,
        ...(distinctId && sessionId ? { $session_id: sessionId } : {}),
        ...(distinctId ? {} : { $process_person_profile: false }),
      },
    });
  } catch (error) {
    console.error(`[posthog] ${event} no se pudo enviar`, error);
  }
}
