/**
 * Meta Pixel del lado del navegador. Sólo se miden CUATRO eventos, decididos a
 * propósito: tres estándar (`META_EVENTS`) y uno custom
 * (`META_CUSTOM_EVENTS`); cualquier otro se agrega acá primero.
 *
 * Sin `NEXT_PUBLIC_META_PIXEL_ID` no se carga nada y todos los helpers son
 * no-op: en dev sin la variable no se ensucian los datos del Pixel real.
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
 * audiencias y embudo; las campañas siguen optimizando sobre `Lead`. Van
 * aparte de `META_EVENTS` para que no entren en la allow-list de
 * `data-meta-event` (ver `components/analytics/meta-pixel-events.tsx`).
 */
export const META_CUSTOM_EVENTS = {
  /** Completó el primer paso (patente/vehículo) del pedido de presupuesto. */
  quoteStart: "QuoteStart",
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
 * `eventId` es el que deduplica contra la Conversions API.
 */
export function trackMetaEvent(
  name: MetaEventName,
  params?: MetaEventParams,
  eventId?: string,
): void {
  if (!META_PIXEL_ID || typeof window === "undefined" || !window.fbq) return;
  try {
    if (eventId) window.fbq("track", name, params ?? {}, { eventID: eventId });
    else window.fbq("track", name, params);
  } catch {
    // La medición nunca rompe la página.
  }
}

/**
 * Manda un evento custom al Pixel (`trackCustom`). Sólo navegador: no tiene
 * contraparte en la Conversions API, así que no lleva `eventID`. Nunca le
 * pases datos personales en `params`.
 */
export function trackMetaCustomEvent(
  name: MetaCustomEventName,
  params?: MetaEventParams,
): void {
  if (!META_PIXEL_ID || typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("trackCustom", name, params);
  } catch {
    // La medición nunca rompe la página.
  }
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
