/** Tipos compartidos por la capa de contenido. */

import type { AnalyticsEventName, LeadSource } from "@/lib/analytics/events";

export type NavLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * CTA del header (y del menú mobile). Un `NavLink` que además puede salir del
 * sitio (WhatsApp: `<a target="_blank">`), llevar ícono y medirse con el
 * listener delegado de `AnalyticsEvents` (`data-analytics-event` +
 * `data-analytics-placement`), sin volver client al header.
 */
export type NavCta = NavLink & {
  readonly external?: boolean;
  readonly icon?: IconName;
  readonly tracking?: {
    /** Evento del catálogo (`ANALYTICS_EVENTS`) marcado `clickable`. */
    readonly event: AnalyticsEventName;
    /** `placement` del CTA en el header. */
    readonly placement: string;
    /** `placement` del mismo CTA dentro del menú mobile. */
    readonly menuPlacement: string;
    /**
     * `lead_source` (valor de `LEAD_SOURCES`): convierte como `Lead` en Meta.
     * Sin él, el evento sale sin fuente.
     */
    readonly leadSource?: LeadSource;
  };
};

export type FaqItem = {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
};

export type FaqCategory = {
  readonly id: string;
  readonly name: string;
  readonly items: readonly FaqItem[];
};

export type FeatureItem = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Clave del ícono en `components/ui/icon.tsx`. */
  readonly icon: IconName;
};

export type IconName =
  | "document"
  | "bell"
  | "clock"
  | "car"
  | "pin"
  | "arrow-right"
  | "arrow-left"
  | "check"
  | "chat"
  | "whatsapp"
  | "receipt"
  | "spinner"
  | "ellipsis"
  | "info"
  | "alert";

/** Tiendas donde está publicada la app. */
export type StoreId = "appStore" | "playStore";

export type StoreLink = {
  readonly id: StoreId;
  /** Bajada chica del botón: "Descargala en". */
  readonly label: string;
  /** Nombre de la tienda, la línea grande del botón. */
  readonly name: string;
  readonly href: string;
};

export type TimelineEntry = {
  readonly id: string;
  readonly date: string;
  readonly title: string;
  readonly detail: string;
};
