/** Tipos compartidos por la capa de contenido. */

import type { AnalyticsEventName, LeadSource } from "@/lib/analytics/events";

export type NavLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Item de un desplegable del header (y de su lista en el menú mobile).
 * `description` es una línea opcional, factual, debajo del label. `external`
 * lo abre en otra pestaña (un destino fuera del sitio). `icon` es un ícono
 * de línea a la izquierda (los grupos con íconos los llevan en todos sus
 * items, para que los labels queden alineados).
 */
export type NavItem = NavLink & {
  readonly description?: string;
  readonly external?: boolean;
  readonly icon?: IconName;
  /** Discrimina contra `NavComingSoonItem` (`if (item.comingSoon)`). */
  readonly comingSoon?: never;
};

/**
 * Item anunciado pero todavía no operativo (p. ej. Financiamiento). NO es un
 * link ni recibe foco: no hay página a la que llevar y un link a "pronto"
 * sería un callejón sin salida. Se muestra apagado y con la marca
 * "Próximamente" (`siteContent.nav.comingSoonLabel`) en el mismo elemento,
 * así el lector de pantalla la lee junto con el label.
 */
export type NavComingSoonItem = {
  readonly label: string;
  readonly icon?: IconName;
  readonly comingSoon: true;
};

/** Lo que puede ir en la lista de un grupo. */
export type NavGroupItem = NavItem | NavComingSoonItem;

/**
 * Link al pie de un grupo, separado de los items por una línea fina: una
 * salida para quien no se reconoce en ningún item. `lead` es la pregunta que
 * va antes del label, dentro del mismo link.
 */
export type NavGroupFooterLink = NavLink & {
  readonly lead?: string;
};

/** Entrada suelta del nav principal: un link directo, sin desplegable. */
export type NavLinkEntry = NavLink & {
  readonly kind: "link";
};

/**
 * Grupo del nav principal: un desplegable en desktop y una lista con
 * etiqueta en el menú mobile. Un grupo sin items no se renderiza.
 */
export type NavGroup = {
  readonly kind: "group";
  readonly id: string;
  readonly label: string;
  readonly items: readonly NavGroupItem[];
  readonly footerLink?: NavGroupFooterLink;
};

/** Entrada del nav principal, en el orden en que se muestra. */
export type NavEntry = NavLinkEntry | NavGroup;

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

/**
 * Item de la franja de verticales de la home (`VerticalsBandSection`): solo
 * el nombre. `comingSoon` marca una vertical anunciada pero no operativa,
 * que se muestra con la marca "Próximamente".
 */
export type VerticalItem = {
  readonly label: string;
  readonly comingSoon?: true;
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
  | "search"
  | "chat"
  | "whatsapp"
  | "receipt"
  | "spinner"
  | "ellipsis"
  | "info"
  | "alert"
  | "image"
  | "linkedin"
  | "calendar"
  | "users"
  | "smartphone"
  | "wrench"
  | "shield"
  | "file-text"
  | "cog"
  | "credit-card"
  | "share";

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
