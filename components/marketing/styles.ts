/**
 * Clases tipográficas del rediseño 2026-11 (sistema "AutoLibre AI") que
 * comparten el Home y `/pedido`. El nivel del heading lo decide cada página;
 * acá solo vive cómo se ve.
 */

/** `h2` de sección: Outfit 700, 28 → 36px. */
export const sectionTitle =
  "font-display text-3xl font-bold tracking-tight text-balance text-fg md:text-4xl";

/** `h2` grande (cómo funciona, panel de la app, cierre): 30 → 44px. */
export const sectionTitleLg =
  "font-display text-3xl leading-tight font-bold tracking-tight text-balance md:text-4xl lg:text-5xl";

/** Bajada de sección. */
export const sectionLead = "text-lead text-fg-muted";

/** Rótulo en mayúsculas (eyebrow o título chico de una columna). */
export const eyebrow = "text-label font-semibold tracking-wider text-fg-muted uppercase";

/** Link de texto dentro de un párrafo. */
export const inlineLink =
  "font-semibold text-fg underline underline-offset-4 transition-colors hover:text-brand-hover motion-reduce:transition-none";

/** Eyebrow sobre fondo oscuro (`action`): `brand-200`, 9.81:1. */
export const eyebrowOnDark = "text-label font-semibold tracking-wider text-brand-200 uppercase";
