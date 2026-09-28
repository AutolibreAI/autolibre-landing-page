import type { PostHog } from "posthog-js";
import { ANALYTICS_APP, type AnalyticsProps } from "./events";

/**
 * PostHog del lado del navegador (región US; el proyecto puede ser el mismo
 * que el de la app mobile, por eso todo evento lleva `app: "landing"`, ver
 * `ANALYTICS_APP`), cargado FUERA del camino crítico:
 *
 * - `instrumentation-client.ts` llama a `schedulePostHogLoad()`: `posthog-js`
 *   baja con un `import()` dinámico recién después del `load` y en
 *   idle. No compite con el LCP ni con la hidratación (INP).
 * - Lo que se trackea antes de que cargue (`capturePostHog`) queda en una
 *   cola con su timestamp y se vacía apenas termina el `init`.
 * - Sólo mide en el deploy de Production de Vercel
 *   (`NEXT_PUBLIC_VERCEL_ENV === "production"`) y con
 *   `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`. Fuera de eso no se carga nada y todo
 *   es no-op: dev (aunque el token esté en el `.env` local) y previews no
 *   ensucian los datos. El corte es por código y no por dónde se cargó la
 *   variable, así no depende de acordarse.
 *
 * Variables de entorno:
 * - `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`: token `phc_…` del proyecto. Público
 *   por diseño (viaja en el bundle de cualquier sitio que use PostHog).
 * - `POSTHOG_HOST` (sólo server): host de ingesta, lo usan los rewrites de
 *   `/ingest` en `next.config.ts` y `posthog-node`. El navegador NO lo
 *   necesita: siempre habla con `/ingest` (mismo origen, ver `next.config.ts`).
 *
 * Nunca se llama a `identify`: todo es anónimo (`person_profiles:
 * "identified_only"` no crea perfiles). Grabación de sesiones, heatmaps,
 * dead clicks, logs de consola, web vitals y errores de JS los prende o
 * apaga la config REMOTA del proyecto: acá no se pisan. El replay enmascara
 * los inputs; el texto libre que la persona cargó y se muestra fuera de un
 * input lleva `ph-no-capture` (ver `hidePlacesDropdownFromReplay` y la
 * confirmación de `/pedido`). Si cambia algo de esto, actualizar
 * `lib/content/privacidad.ts`.
 */

/**
 * `NEXT_PUBLIC_VERCEL_ENV` la expone Vercel sola en el build (variables de
 * sistema). Fuera de Vercel no existe, así que local nunca mide.
 */
const IS_MEASURED_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

const POSTHOG_TOKEN = IS_MEASURED_ENV
  ? process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || undefined
  : undefined;

/** Tope de la cola previa al `init`: un bucle no puede crecerla sin límite. */
const MAX_QUEUED_EVENTS = 50;

/** Tope de espera del idle: en un navegador ocupado, carga igual pasado esto. */
const IDLE_TIMEOUT_MS = 4000;

type QueuedEvent = { event: string; props?: AnalyticsProps; timestamp: Date };

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
let scheduled = false;
const queue: QueuedEvent[] = [];

function flushQueue(posthog: PostHog) {
  for (const { event, props, timestamp } of queue.splice(0)) {
    try {
      posthog.capture(event, props, { timestamp });
    } catch {
      // La medición nunca rompe la página.
    }
  }
}

/**
 * Baja `posthog-js` e inicializa. Idempotente: el módulo de `posthog-js` es
 * un singleton, y si otra copia de este helper ya lo inicializó
 * (`__loaded`) sólo se toma la instancia.
 */
function loadPostHog(): Promise<PostHog | null> {
  if (!POSTHOG_TOKEN || typeof window === "undefined") return Promise.resolve(null);
  loading ??= import("posthog-js")
    .then(({ default: posthog }) => {
      if (!posthog.__loaded) {
        posthog.init(POSTHOG_TOKEN, {
          // Proxy propio (rewrites de `next.config.ts`): mismo origen, así los
          // bloqueadores que filtran `*.posthog.com` no se comen los eventos.
          api_host: "/ingest",
          ui_host: "https://us.posthog.com",
          // Snapshot de defaults más nuevo de la versión instalada.
          defaults: "2026-08-30",
          // Pageview inicial + uno por cada cambio de pathname del router.
          capture_pageview: "history_change",
          capture_pageleave: true,
          // Anónimo: nunca hay `identify`, así que no se crean perfiles.
          person_profiles: "identified_only",
          // Clicks: sólo los eventos del catálogo. Autocapture (y rageclick,
          // que depende de él) manda el texto del elemento clickeado y suma
          // trabajo en cada click (INP); el embudo sale de eventos explícitos.
          autocapture: false,
          rageclick: false,
          // El proyecto es compartido con la app mobile: si ahí se usan
          // encuestas, tours o el chat, la landing no baja esos scripts.
          disable_surveys: true,
          disable_product_tours: true,
          disable_conversations: true,
          debug: process.env.NODE_ENV === "development",
        });
        // Super property: la llevan todos los eventos, incluido el pageview
        // inicial (PostHog lo manda en un `setTimeout` después del `init`).
        posthog.register({ app: ANALYTICS_APP });
      }
      client = posthog;
      flushQueue(posthog);
      return posthog;
    })
    .catch(() => {
      // Chunk bloqueado o sin red: se descarta la cola y se puede reintentar.
      queue.length = 0;
      loading = null;
      return null;
    });
  return loading;
}

/**
 * Programa la carga de PostHog para después del `load` y en idle. Lo llama
 * `instrumentation-client.ts` (antes de hidratar) y, por las dudas, el
 * primer `capturePostHog` que encuentre la cola sin carga programada.
 */
export function schedulePostHogLoad(): void {
  if (!POSTHOG_TOKEN || typeof window === "undefined" || scheduled) return;
  scheduled = true;

  const whenIdle = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => void loadPostHog(), { timeout: IDLE_TIMEOUT_MS });
    } else {
      setTimeout(() => void loadPostHog(), 1);
    }
  };

  if (document.readyState === "complete") whenIdle();
  else window.addEventListener("load", whenIdle, { once: true });
}

/** Manda un evento a PostHog, o lo encola si todavía no cargó. */
export function capturePostHog(event: string, props?: AnalyticsProps): void {
  if (!POSTHOG_TOKEN || typeof window === "undefined") return;
  if (client) {
    try {
      client.capture(event, props);
    } catch {
      // La medición nunca rompe la página.
    }
    return;
  }
  if (queue.length < MAX_QUEUED_EVENTS) {
    queue.push({ event, props, timestamp: new Date() });
  }
  schedulePostHogLoad();
}

/**
 * IDs de la persona anónima y de la sesión actuales, para que un evento
 * server-side (`quote_submitted`) caiga en la misma persona y sesión. `null`
 * si PostHog no está (sin token, bloqueado o todavía sin cargar): el server
 * usa un ID propio sin perfil.
 */
export function getPostHogIds(): { distinctId: string; sessionId: string } | null {
  if (!client) return null;
  try {
    const distinctId = client.get_distinct_id();
    const sessionId = client.get_session_id();
    return distinctId && sessionId ? { distinctId, sessionId } : null;
  } catch {
    return null;
  }
}
