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

export type IconName =
  | "document"
  | "bell"
  | "clock"
  | "car"
  | "pin"
  | "arrow-right"
  | "check";

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
