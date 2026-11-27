/** Tipos compartidos por la capa de contenido. */

export type NavLink = {
  readonly label: string;
  readonly href: string;
};

/** Link de un submenú del header: suma una bajada de una línea. */
export type NavSubLink = NavLink & {
  readonly description: string;
};

/**
 * Link de sección del header (Proveedores, Blog, Sobre nosotros). Con
 * `submenu`, en desktop lleva al lado un botón que abre un panel con esos
 * links y en el menú mobile se listan debajo, indentados.
 */
export type NavSectionLink = NavLink & {
  readonly submenu?: {
    /** Nombre accesible del botón que abre y cierra el panel (desktop). */
    readonly toggleLabel: string;
    readonly links: readonly NavSubLink[];
  };
};

/**
 * Opción del menú de cuenta del header: un link (con bajada opcional), un
 * separador o el título de un grupo (no es un heading: es un rótulo).
 */
export type AccountMenuEntry =
  | {
      readonly kind: "link";
      readonly label: string;
      readonly href: string;
      /** Bajada chica debajo del label. */
      readonly sub?: string;
      /** La opción principal del estado: en semibold. */
      readonly strong?: boolean;
    }
  | { readonly kind: "rule" }
  | { readonly kind: "group"; readonly label: string };

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
 * Función de la app que destaca el hero de la home. Cada texto tiene que
 * tener una pantalla o flujo real detrás y no puede prometer ahorro, ni
 * reducción de multas, ni financiación.
 */
export type HeroHighlight = {
  readonly id: string;
  /** Clave del ícono en `components/ui/icon.tsx` (decorativo). */
  readonly icon: IconName;
  readonly text: string;
};

export type IconName =
  | "pause"
  | "play"
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
  | "phone"
  | "navigation"
  | "share"
  | "star"
  | "instagram"
  | "globe"
  | "shield-check"
  | "calendar"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "filter"
  | "bolt"
  | "camera"
  | "users"
  | "smartphone"
  | "wrench"
  | "user"
  | "chart"
  | "lock"
  | "plus"
  | "x";

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
