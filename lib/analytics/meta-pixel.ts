/**
 * Meta Pixel del lado del navegador: el vocabulario de Meta y el envío a
 * `fbq`. QUÉ se mide y con qué params lo decide el catálogo único de
 * `lib/analytics/events.ts`; los componentes llaman a `track()`
 * (`lib/analytics/track.ts`), nunca a este módulo directo. Al Pixel llegan
 * CINCO eventos, decididos a propósito: tres estándar (`META_EVENTS`) y dos
 * custom (`META_CUSTOM_EVENTS`).
 *
 * - `PageView`: carga inicial (stub del layout) y cada navegación
 *   (`AnalyticsEvents`).
 * - `Lead`: las dos conversiones del pedido, separadas por `lead_source`
 *   para que la campaña a `/pedido` optimice sobre UN solo evento estándar:
 *   - pedido de presupuesto registrado (`quote_submitted`, modal y
 *     `/pedido`; en `/pedido` con `lead_source: "form"`), con el mismo
 *     `eventID` que el `Lead` de la Conversions API para deduplicar.
 *   - click en WhatsApp en `/pedido` (`whatsapp_clicked` con
 *     `lead_source: "whatsapp"`), con `placement`. Sólo Pixel.
 * - `Contact`: `whatsapp_clicked` sin `lead_source` (home, y la confirmación
 *   de un pedido con `pedido: true`: esa persona ya contó como `Lead`).
 * - `QuoteStart` (custom): `quote_started`.
 * - `PedidoPaso` (custom): `quote_step_viewed`, sólo en el modal.
 *
 * Sin `NEXT_PUBLIC_META_PIXEL_ID` no se carga nada y todo es no-op: en dev
 * sin la variable no se ensucian los datos del Pixel real.
 */

/** Público por diseño: el ID del Pixel viaja igual en el HTML de cualquier sitio. */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || undefined;

/** Nombres estándar de Meta. Van tal cual: el Events Manager no reconoce otros. */
export const META_EVENTS = {
  pageView: "PageView",
  lead: "Lead",
  contact: "Contact",
} as const;

export type MetaEventName = (typeof META_EVENTS)[keyof typeof META_EVENTS];

/**
 * Eventos custom: van por `trackCustom`, no por `track`. Sirven para
 * audiencias y embudo; las campañas siguen optimizando sobre `Lead`.
 */
export const META_CUSTOM_EVENTS = {
  /**
   * Empezó un pedido de presupuesto. En el modal: completó el primer paso
   * (patente/vehículo). En `/pedido`: primera interacción con el form.
   */
  quoteStart: "QuoteStart",
  /**
   * Embudo del pedido: la persona VE el paso `{ step: n }` (1..4). Una vez
   * por paso y por instancia del flujo. Sin datos de lo que cargó.
   */
  quoteStep: "PedidoPaso",
} as const;

export type MetaCustomEventName =
  (typeof META_CUSTOM_EVENTS)[keyof typeof META_CUSTOM_EVENTS];

type MetaEventParams = Record<string, string | number | boolean>;

/** Firma mínima de `fbq`: la que usamos, no la API entera. */
export type Fbq = {
  (command: "init", pixelId: string): void;
  (
    command: "track" | "trackCustom",
    event: string,
    params?: MetaEventParams,
    options?: { eventID?: string },
  ): void;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/**
 * Manda un evento al Pixel. Si `fbevents.js` todavía no bajó (se carga con
 * `lazyOnload`), el stub del layout lo encola y se despacha cuando llega.
 *
 * - `custom`: va por `trackCustom`. No tiene contraparte en la Conversions
 *   API, así que nunca lleva `eventID`.
 * - `eventId`: el que deduplica contra la Conversions API (sólo estándar).
 */
export function sendMetaEvent(
  name: string,
  { custom = false, params, eventId }: {
    custom?: boolean;
    params?: MetaEventParams;
    eventId?: string;
  } = {},
): void {
  if (!META_PIXEL_ID || typeof window === "undefined" || !window.fbq) return;
  try {
    if (custom) window.fbq("trackCustom", name, params);
    else if (eventId) window.fbq("track", name, params ?? {}, { eventID: eventId });
    else window.fbq("track", name, params);
  } catch {
    // La medición nunca rompe la página.
  }
}

/** `PageView` de una navegación del router (la carga inicial la manda el stub). */
export function trackMetaPageView(): void {
  sendMetaEvent(META_EVENTS.pageView);
}

/**
 * ID compartido entre el Pixel y la Conversions API para un mismo evento.
 * `crypto.randomUUID` exige contexto seguro: en http por IP de LAN (probar en
 * el celu contra el dev server) no existe, de ahí el fallback.
 */
export function createMetaEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
