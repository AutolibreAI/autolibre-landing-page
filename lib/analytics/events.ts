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
  /**
   * Empezó un pedido de presupuesto (form de `/pedido` o pestaña Taller del
   * módulo de pedido, con `tab` y `placement`). Meta: `QuoteStart`.
   */
  quoteStarted: "quote_started",
  /**
   * Vio un paso del modal de presupuesto o el paso 2 del módulo de pedido
   * (con `tab` y `placement`). Meta: `PedidoPaso`.
   */
  quoteStepViewed: "quote_step_viewed",
  /**
   * Eligió una pestaña del módulo de pedido (Taller, Auxilio, Multas,
   * Seguro). Solo la elección de la persona: la pestaña inicial no cuenta.
   * Sólo PostHog.
   */
  quoteTabSelected: "quote_tab_selected",
  /** Tocó un chip de "Lo más pedido" del módulo de pedido. Sólo PostHog. */
  quoteChipClicked: "quote_chip_clicked",
  /**
   * Click en el CTA de un aliado desde una pestaña del módulo de pedido
   * (Auxilio → Asistir24, Multas → Sin Fotomultas). Es el "inicio del
   * pedido" de esas pestañas, que no tienen form propio. Sólo PostHog.
   */
  quotePartnerClicked: "quote_partner_clicked",
  /**
   * Pedido registrado por el backend. En PostHog lo manda el SERVER (ver
   * `app/api/presupuesto/route.ts`); el navegador sólo manda el `Lead` de Meta
   * con el `eventID` compartido con la Conversions API.
   */
  quoteSubmitted: "quote_submitted",
  /** El envío del pedido falló (red o respuesta de error). Sólo PostHog. */
  quoteFailed: "quote_failed",
  /**
   * Se mostró el bloque "Así se ve en la app" del estado enviado del módulo de
   * pedido (una vez por envío, al aparecer). Sólo PostHog.
   */
  pedidoAppPromoView: "pedido_app_promo_view",
  /**
   * Click en un botón de tienda de una superficie de descarga con `section`
   * (hoy solo el estado enviado del módulo de pedido). Lo pidió la
   * especificación del ajuste "pedido enviado" (2026-11-24). Viaja JUNTO con
   * `app_store_clicked` en el mismo click (`data-analytics-event` con los
   * dos nombres): ese sigue siendo el conteo de clicks a tienda de todo el
   * sitio y no se corta. Sólo PostHog.
   */
  ctaDownloadClick: "cta_download_click",
  /**
   * El QR de descarga entró en pantalla (solo existe desde `lg`: en celular
   * no se dibuja y no se manda). Una vez por envío. Sólo PostHog.
   */
  qrView: "qr_view",
  /**
   * Click en "Pedir presupuesto" del estado vacío del directorio de
   * proveedores (una búsqueda o un filtro sin negocios). Mide cuántas
   * búsquedas sin resultados se rescatan. Sólo PostHog. Los props dicen QUÉ
   * filtros había, nunca su valor: ni el texto buscado ni la zona.
   */
  directoryEmptyQuoteClicked: "directory_empty_quote_clicked",
  /**
   * Embudo de contratación online (spec 212). Sólo PostHog: si marketing
   * quiere optimizar campañas sobre la suscripción, el que va a Meta es
   * `plan_checkout_confirmed` (decisión pendiente).
   *
   * Click en "Quiero el plan …" de `/proveedores/planes` (clickable, con
   * `data-analytics-plan`).
   */
  planCheckoutStarted: "plan_checkout_started",
  /** El backend creó el checkout y se manda a Mercado Pago. */
  planCheckoutRedirected: "plan_checkout_redirected",
  /**
   * La pantalla de resultado confirmó la suscripción (estado del backend, no
   * los params de MP). Una vez por checkout: sólo si en esta pestaña había un
   * checkout pendiente.
   */
  planCheckoutConfirmed: "plan_checkout_confirmed",
  /**
   * Baja de un plan pago desde `/cuenta`. Sólo PostHog. `requested`: confirmó
   * la baja en la pantalla (cada intento, también los reintentos);
   * `succeeded`: el backend la registró; `failed`: el backend o la red la
   * rechazaron (con el motivo, nunca datos del taller).
   */
  subscriptionCancelRequested: "subscription_cancel_requested",
  subscriptionCancelSucceeded: "subscription_cancel_succeeded",
  subscriptionCancelFailed: "subscription_cancel_failed",
  /**
   * Click en un link al alta de talleres desde otra pantalla (clickable, con
   * `data-analytics-placement`, ej. `cuenta_otro_taller_cargar`, o los
   * "Sumá tu negocio" del layout: `header`, `account_menu`, `footer`). Sólo
   * PostHog. Hasta el 2026-11-05 lo mandaba también el botón "Registrar mi
   * taller" de `/proveedores/registro` (sin `placement`), que ya no existe:
   * la página es el formulario.
   */
  partnerRegisterStarted: "partner_register_started",
  /**
   * Click en un link al reclamo de un taller (`/proveedores/reclamar`)
   * (clickable, con `data-analytics-placement`, ej.
   * `cuenta_otro_taller_reclamar`). Sólo PostHog. Nunca el código.
   */
  partnerClaimStarted: "partner_claim_started",
  /** Canje exitoso de un código de reclamo (spec 211). Nunca el código. */
  partnerClaimRedeemed: "partner_claim_redeemed",
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
  /** Barra fija inferior en celular (home, `/pedido` y directorio). */
  mobileBar: "mobile_bar",
  /** Tarjetas de "Todo lo que podés pedir" del Home (llevan a `/pedido`). */
  homeServices: "home_services",
  /** "Hacé tu pedido" de la banda de cierre de `/pedido` (sube al módulo). */
  pedidoCtaBand: "pedido_cta_band",
  /**
   * "Pedir propuestas" de la banda "¿No sabés a quién elegir?" del directorio
   * (`/proveedores`): lleva a `/pedido` con el texto ya cargado.
   */
  directoryBand: "directory_band",
} as const;

export type QuoteCtaPlacement =
  (typeof QUOTE_CTA_PLACEMENTS)[keyof typeof QUOTE_CTA_PLACEMENTS];

/**
 * Ubicaciones del layout compartido (header, menú de cuenta, barra fija,
 * footer y botón flotante). Viajan como `placement` de `whatsapp_clicked`
 * (WhatsApp de AutoLibre, sin `lead_source`: en Meta es `Contact`) y de
 * `partner_register_started` ("Sumá tu negocio"). Son strings libres en el
 * listener; esta lista es la referencia para no inventar variantes.
 */
export const LAYOUT_PLACEMENTS = {
  /** "Sumá tu negocio" del header (desde `lg`). */
  header: "header",
  /** "Sumá tu negocio" dentro del menú de cuenta (o del menú mobile). */
  accountMenu: "account_menu",
  /** Barra fija inferior en celular. */
  mobileBar: "mobile_bar",
  /** Links del footer. */
  footer: "footer",
  /** Botón flotante de WhatsApp. */
  fab: "fab",
} as const;

/**
 * Pestañas del módulo de pedido (`components/modulo-pedido`). Viaja como
 * `tab`; el listener de `data-analytics-tab` y la route de
 * `/api/presupuesto` descartan cualquier otro valor. Solo `taller` manda un
 * pedido al backend; Auxilio y Multas llevan a un aliado. Sin `seguro`
 * desde el 2026-11-24 (decisión de producto: no se ofrecen seguros por
 * ahora); los eventos viejos con `tab: "seguro"` quedan en el histórico.
 */
export const QUOTE_TABS = {
  taller: "taller",
  auxilio: "auxilio",
  multas: "multas",
} as const;

export type QuoteTab = (typeof QUOTE_TABS)[keyof typeof QUOTE_TABS];

/**
 * Dónde está montado el módulo de pedido. Viaja como `placement` de sus
 * eventos (incluido `whatsapp_clicked`) y del `quote_submitted` del server.
 */
export const QUOTE_MODULE_PLACEMENTS = {
  home: "modulo_home",
  pedido: "modulo_pedido",
} as const;

export type QuoteModulePlacement =
  (typeof QUOTE_MODULE_PLACEMENTS)[keyof typeof QUOTE_MODULE_PLACEMENTS];

/** Chips de "Lo más pedido" del módulo. Viaja como `chip` (el id, nunca texto libre). */
export const QUOTE_CHIPS = {
  service: "service",
  luzTablero: "luz_tablero",
  alineacion: "alineacion_balanceo",
  frenos: "frenos",
  aire: "aire_acondicionado",
} as const;

export type QuoteChip = (typeof QUOTE_CHIPS)[keyof typeof QUOTE_CHIPS];

/** Props comunes de los eventos del módulo de pedido. */
type QuoteModuleProps = {
  /** Pestaña del módulo. Solo en eventos del módulo de pedido. */
  tab?: QuoteTab;
  /** Dónde está montado el módulo. */
  placement?: QuoteModulePlacement;
};

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

/**
 * Superficie de descarga de `cta_download_click` y `qr_view`. Viaja como
 * `section`; el listener de `data-analytics-section` descarta cualquier otro
 * valor.
 */
export const DOWNLOAD_SECTIONS = {
  /** Bloque de la app del estado enviado del módulo de pedido. */
  pedidoEnviado: "pedido_enviado",
} as const;

export type DownloadSection = (typeof DOWNLOAD_SECTIONS)[keyof typeof DOWNLOAD_SECTIONS];

/**
 * Planes pagos de proveedores: los `code` del backend (`GET /billing/plans`).
 * Viaja como `plan`; el listener de `data-analytics-plan` descarta cualquier
 * otro valor.
 */
export const PARTNER_PLANS = {
  plus: "plus",
  plusMax: "plus_max",
} as const;

export type PartnerPlan = (typeof PARTNER_PLANS)[keyof typeof PARTNER_PLANS];

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
    /** Pestaña del módulo de pedido desde la que se abrió el chat. */
    tab?: QuoteTab;
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
    /** Superficie de descarga, si la tiene (ver `cta_download_click`). */
    section?: DownloadSection;
  };
  quote_cta_clicked: { placement: QuoteCtaPlacement };
  quote_started: { flow: QuoteFlow } & QuoteModuleProps;
  quote_step_viewed: { flow: QuoteFlow; step: number } & QuoteModuleProps;
  quote_submitted: { flow: QuoteFlow; lead_source?: LeadSource } & QuoteModuleProps;
  quote_failed: {
    flow: QuoteFlow;
    /** `network`: no hubo respuesta. `server`: el backend respondió error. */
    reason: "network" | "server";
    status?: number;
  } & QuoteModuleProps;
  quote_tab_selected: { tab: QuoteTab; placement: QuoteModulePlacement };
  pedido_app_promo_view: {
    placement: QuoteModulePlacement;
    /** Copy con el pedido ya en la app (`APP_VINCULADA`). Hoy siempre `false`. */
    app_linked: boolean;
  };
  cta_download_click: {
    store: AppStore;
    section: DownloadSection;
    /** Dónde está montado el módulo (`modulo_home` o `modulo_pedido`). */
    placement?: string;
  };
  qr_view: { section: DownloadSection; placement?: QuoteModulePlacement };
  quote_chip_clicked: {
    chip: QuoteChip;
    placement: QuoteModulePlacement;
    /** `true` si el toque lo dejó puesto; `false` si lo sacó. */
    selected: boolean;
  };
  quote_partner_clicked: { tab: QuoteTab; placement?: string };
  directory_empty_quote_clicked: {
    /** Había una búsqueda por nombre. Sólo la presencia, nunca el texto. */
    has_query?: true;
    /** Había una zona elegida. Sólo la presencia, nunca cuál. */
    has_zone?: true;
    /** Había un rubro elegido. */
    has_category?: true;
  };
  plan_checkout_started: { plan: PartnerPlan };
  plan_checkout_redirected: { plan: PartnerPlan };
  plan_checkout_confirmed: {
    plan: PartnerPlan;
    /** La suscripción arrancó en período de prueba. */
    trial?: boolean;
  };
  subscription_cancel_requested: {
    plan: PartnerPlan;
    /** La suscripción estaba en período de prueba. */
    trial?: boolean;
  };
  subscription_cancel_succeeded: {
    plan: PartnerPlan;
    trial?: boolean;
  };
  subscription_cancel_failed: {
    plan: PartnerPlan;
    /** `retryable`: 503/5xx/red. `not_found`: 404 uniforme o 400. `unauthenticated`: 401. */
    reason: "retryable" | "not_found" | "unauthenticated";
  };
  partner_register_started: {
    /** De qué link vino (`cuenta_otro_taller_cargar`…). */
    placement?: string;
  };
  partner_claim_started: {
    /** De qué link vino (`cuenta_otro_taller_reclamar`…). */
    placement?: string;
  };
  partner_claim_redeemed: {
    /** El canje vino de la contratación de un plan (`?next`). */
    from_checkout?: true;
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
  quote_tab_selected: {
    posthog: "client",
    meta: () => null,
    clickable: false,
  },
  pedido_app_promo_view: {
    posthog: "client",
    meta: () => null,
    clickable: false,
  },
  cta_download_click: {
    posthog: "client",
    meta: () => null,
    clickable: true,
  },
  qr_view: {
    posthog: "client",
    meta: () => null,
    clickable: false,
  },
  quote_chip_clicked: {
    posthog: "client",
    meta: () => null,
    clickable: false,
  },
  quote_partner_clicked: {
    posthog: "client",
    meta: () => null,
    clickable: true,
  },
  directory_empty_quote_clicked: {
    posthog: "client",
    meta: () => null,
    clickable: true,
  },
  plan_checkout_started: {
    posthog: "client",
    meta: () => null,
    clickable: true,
  },
  plan_checkout_redirected: {
    posthog: "client",
    meta: () => null,
    clickable: false,
  },
  plan_checkout_confirmed: {
    posthog: "client",
    meta: () => null,
    clickable: false,
  },
  subscription_cancel_requested: {
    posthog: "client",
    meta: () => null,
    clickable: false,
  },
  subscription_cancel_succeeded: {
    posthog: "client",
    meta: () => null,
    clickable: false,
  },
  subscription_cancel_failed: {
    posthog: "client",
    meta: () => null,
    clickable: false,
  },
  partner_register_started: {
    posthog: "client",
    meta: () => null,
    clickable: true,
  },
  partner_claim_started: {
    posthog: "client",
    meta: () => null,
    clickable: true,
  },
  partner_claim_redeemed: {
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
