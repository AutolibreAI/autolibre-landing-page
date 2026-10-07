import { META_CUSTOM_EVENTS, META_EVENTS } from "./meta-pixel";

/**
 * Super property `app` de TODOS los eventos de PostHog de la landing (los
 * del navegador vía `register` y los del server). El proyecto de PostHog
 * puede ser el mismo que el de la app mobile: esto es lo que permite
 * separarlos en cualquier insight.
 */
export const ANALYTICS_APP = "landing";

/**
 * Catálogo ÚNICO de eventos del sitio. Nombres de producto en snake_case
 * (los que se ven en PostHog); cada entrada decide además si tiene un
 * equivalente en Meta y con qué params. Cualquier evento nuevo se agrega acá
 * primero: `track()` (`lib/analytics/track.ts`) no manda nada que no esté en
 * este catálogo.
 *
 * Isomórfico a propósito (sin `window`, sin `"use client"`): la route de
 * `/api/presupuesto` importa de acá el nombre de `quote_submitted` y los
 * valores cerrados de `lead_source` y `flow`.
 *
 * Nunca datos personales en los props: ni nombre, ni WhatsApp, ni correo, ni
 * patente, ni zona, ni lo que la persona escribe.
 */
export const ANALYTICS_EVENTS = {
  /** Click en un link de WhatsApp. Meta: `Lead` si trae `lead_source`, si no `Contact`. */
  whatsappClicked: "whatsapp_clicked",
  /**
   * Click en una acción del perfil de un proveedor (llamar, cómo llegar,
   * pedir propuesta, compartir). Sólo PostHog. El WhatsApp del perfil usa
   * `whatsapp_clicked` con el prop `provider`.
   */
  providerActionClicked: "provider_action_clicked",
  /** Click en un botón de tienda (App Store / Google Play). Sólo PostHog. */
  appStoreClicked: "app_store_clicked",
  /**
   * Click en un CTA de presupuesto (header, menú, banda de la home o
   * footer): todos van a `/pedido`. Sólo PostHog; es lo que permite saber de
   * qué botón vino un pedido, ya que el `flow` de `quote_started` es siempre
   * `page` desde que la home no abre más el modal.
   */
  quoteCtaClicked: "quote_cta_clicked",
  /** Empezó un pedido de presupuesto en `/pedido`. Meta: `QuoteStart`. */
  quoteStarted: "quote_started",
  /** Vio un paso del modal de presupuesto. Meta: `PedidoPaso`. */
  quoteStepViewed: "quote_step_viewed",
  /**
   * Pedido registrado por el backend. En PostHog lo manda el SERVER (ver
   * `app/api/presupuesto/route.ts`); el navegador sólo manda el `Lead` de Meta
   * con el `eventID` compartido con la Conversions API.
   */
  quoteSubmitted: "quote_submitted",
  /** El envío del pedido falló (red o respuesta de error). Sólo PostHog. */
  quoteFailed: "quote_failed",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/**
 * De dónde vino un `Lead`: viaja como `lead_source`. Los dos caminos de
 * `/pedido` convierten con el mismo evento estándar de Meta (la campaña
 * optimiza sobre `Lead`) y este param es lo que permite separarlos en los
 * reportes. Cerrado a propósito: el listener de `data-analytics-lead-source`
 * descarta cualquier otro valor.
 */
export const LEAD_SOURCES = {
  /** Envió el form de `/pedido` y el backend lo registró. */
  form: "form",
  /** Tocó un botón de WhatsApp en `/pedido` (salvo el de la confirmación). */
  whatsapp: "whatsapp",
} as const;

export type LeadSource = (typeof LEAD_SOURCES)[keyof typeof LEAD_SOURCES];

/**
 * Acciones medibles del perfil de un proveedor. Cerrado a propósito: el
 * listener de `data-analytics-action` descarta cualquier otro valor.
 */
export const PROVIDER_ACTIONS = {
  call: "call",
  directions: "directions",
  proposal: "proposal",
  share: "share",
} as const;

export type ProviderAction = (typeof PROVIDER_ACTIONS)[keyof typeof PROVIDER_ACTIONS];

/**
 * Ubicación del CTA de presupuesto. Viaja como `placement` de
 * `quote_cta_clicked`; el listener de `data-analytics-quote-placement`
 * descarta cualquier otro valor.
 */
export const QUOTE_CTA_PLACEMENTS = {
  header: "header",
  headerMenu: "header_menu",
  homeQuotes: "home_quotes",
  footer: "footer",
} as const;

export type QuoteCtaPlacement =
  (typeof QUOTE_CTA_PLACEMENTS)[keyof typeof QUOTE_CTA_PLACEMENTS];

/**
 * Qué flujo de pedido: el form de `/pedido` (`page`) o el modal de la home
 * (`modal`, que ya no se abre desde ningún lado y queda por compatibilidad
 * con el tipo que usa el server y con los reportes históricos).
 */
export const QUOTE_FLOWS = {
  modal: "modal",
  page: "page",
} as const;

export type QuoteFlow = (typeof QUOTE_FLOWS)[keyof typeof QUOTE_FLOWS];

/**
 * Tienda de un click de descarga. Viaja como `store`; el listener de
 * `data-analytics-store` descarta cualquier otro valor.
 */
export const APP_STORES = {
  appStore: "app_store",
  playStore: "google_play",
} as const;

export type AppStore = (typeof APP_STORES)[keyof typeof APP_STORES];

/** Props de cada evento. Tipados para que un typo no abra una columna nueva. */
export type AnalyticsEventProps = {
  whatsapp_clicked: {
    /** Ubicación del botón (`header`, `hero`, `sticky_bar`, `confirmation`…). */
    placement?: string;
    /** Sólo en `/pedido` (salvo la confirmación): convierte como `Lead`. */
    lead_source?: LeadSource;
    /** El click vino después de dejar un pedido. */
    pedido?: true;
    /** Slug del proveedor cuando el click es de su perfil público. */
    provider?: string;
  };
  provider_action_clicked: {
    action: ProviderAction;
    /** Slug del proveedor (identificador de negocio público, no un dato personal). */
    provider: string;
    placement?: string;
  };
  app_store_clicked: {
    store: AppStore;
    placement?: string;
  };
  quote_cta_clicked: { placement: QuoteCtaPlacement };
  quote_started: { flow: QuoteFlow };
  quote_step_viewed: { flow: QuoteFlow; step: number };
  quote_submitted: { flow: QuoteFlow; lead_source?: LeadSource };
  quote_failed: {
    flow: QuoteFlow;
    /** `network`: no hubo respuesta. `server`: el backend respondió error. */
    reason: "network" | "server";
    status?: number;
  };
};

export type AnalyticsProps = Record<string, string | number | boolean>;

/** Evento de Meta equivalente y qué props de PostHog viajan como sus params. */
export type MetaMapping = {
  readonly name: string;
  /** `trackCustom` en lugar de `track` (eventos que no son estándar de Meta). */
  readonly custom?: boolean;
  /**
   * Props que viajan a Meta, si están. Lista cerrada a propósito: Meta recibe
   * exactamente los mismos params que recibía antes de unificar la medición,
   * y un prop nuevo de PostHog no se filtra solo al Pixel.
   */
  readonly params: readonly string[];
};

type CatalogEntry = {
  /**
   * Quién lo manda a PostHog. `client`: `track()` en el navegador. `server`:
   * lo manda una route con `posthog-node` y `track()` NO lo repite (se
   * contaría dos veces). `false`: no va a PostHog.
   */
  readonly posthog: "client" | "server" | false;
  /** Equivalente en Meta según los props del evento, o `null` si no va. */
  readonly meta: (props: AnalyticsProps) => MetaMapping | null;
  /**
   * Se puede disparar con `data-analytics-event` desde un Server Component
   * (listener delegado de `AnalyticsEvents`). Allow-list: los demás sólo se
   * mandan desde código.
   */
  readonly clickable: boolean;
};

export const ANALYTICS_CATALOG: Record<AnalyticsEventName, CatalogEntry> = {
  whatsapp_clicked: {
    posthog: "client",
    // Abrir el chat en `/pedido` es una de las dos conversiones de la campaña
    // (`Lead` con `lead_source: "whatsapp"`); en el resto del sitio, y después
    // de dejar un pedido, es un `Contact` (esa persona ya contó como `Lead`).
    // El WhatsApp del perfil de un proveedor (`provider`) NO va a Meta: es un
    // contacto con un tercero, no una conversión de la campaña, y más `Contact`
    // podría diluir las audiencias. Decisión de marketing pendiente (research
    // D12 de la spec 209): esta es la única línea a cambiar si deciden otra cosa.
    meta: (props) => {
      if (props.provider) return null;
      return props.lead_source
        ? { name: META_EVENTS.lead, params: ["placement", "lead_source"] }
        : { name: META_EVENTS.contact, params: ["placement", "pedido"] };
    },
    clickable: true,
  },
  provider_action_clicked: {
    posthog: "client",
    meta: () => null,
    clickable: true,
  },
  app_store_clicked: {
    posthog: "client",
    meta: () => null,
    clickable: true,
  },
  quote_cta_clicked: {
    posthog: "client",
    meta: () => null,
    clickable: true,
  },
  quote_started: {
    posthog: "client",
    meta: () => ({ name: META_CUSTOM_EVENTS.quoteStart, custom: true, params: [] }),
    clickable: false,
  },
  quote_step_viewed: {
    posthog: "client",
    meta: () => ({ name: META_CUSTOM_EVENTS.quoteStep, custom: true, params: ["step"] }),
    clickable: false,
  },
  quote_submitted: {
    posthog: "server",
    // `lead_source` sólo lo manda `/pedido` (`form`); el modal manda el `Lead`
    // sin params, como siempre.
    meta: () => ({ name: META_EVENTS.lead, params: ["lead_source"] }),
    clickable: false,
  },
  quote_failed: {
    posthog: "client",
    meta: () => null,
    clickable: false,
  },
};

/** Eventos que acepta el listener delegado de `data-analytics-event`. */
export const CLICKABLE_EVENTS: ReadonlySet<string> = new Set(
  (Object.keys(ANALYTICS_CATALOG) as AnalyticsEventName[]).filter(
    (name) => ANALYTICS_CATALOG[name].clickable,
  ),
);
