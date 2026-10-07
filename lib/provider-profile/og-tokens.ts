/**
 * Constantes de la imagen de vista previa (`/proveedor/<slug>/og`). ESPEJAN los tokens
 * de `@theme` de `app/globals.css`: Satori (el motor de `ImageResponse`) no
 * entiende clases de Tailwind ni variables CSS, así que esta imagen es la
 * única excepción documentada a "sin hex sueltos" (Complexity Tracking de la
 * spec 209). Si cambia un token del perfil, cambiarlo también acá.
 */
export const OG_SIZE = { width: 1200, height: 630 } as const;

export const OG_COLORS = {
  /** `--color-card` */
  background: "#fefefd",
  /** `--color-card-line` */
  border: "#e4eae4",
  /** `--color-ink` */
  ink: "#1c2b1c",
  /** Texto secundario (ink a ~75%). */
  inkSoft: "#4a574a",
  /** `--color-brand-50` */
  sealBackground: "#e8f5e8",
  /** `--color-brand` */
  brand: "#2a8c3a",
  /** `--color-rating` */
  rating: "#f59e0b",
  /** Panel de portada ausente. */
  coverPlaceholder: "#dcdedc",
} as const;

/** Panel derecho de la portada, en px. */
export const OG_COVER_WIDTH = 420;
