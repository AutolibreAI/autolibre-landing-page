/** Tipos compartidos por la capa de contenido. */

export type NavLink = {
  readonly label: string;
  readonly href: string;
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
  | "bolt"
  | "camera"
  | "users"
  | "smartphone"
  | "wrench"
  | "user";

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
