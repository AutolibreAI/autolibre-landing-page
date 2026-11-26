/**
 * Clases compartidas de "Mi negocio" (`/cuenta`). Las usan los componentes y
 * sus esqueletos de carga, así el esqueleto ocupa EXACTAMENTE lo mismo que el
 * contenido que reemplaza (CLS ≈ 0).
 */

/**
 * Acción chica de una fila o tarjeta (WhatsApp, "Ver mi plan"): texto con
 * ícono y un área de 44px, sin un botón grande por fila (referencia: las
 * listas de "setup" de Jobber y Podia). El `-mr-3` alinea el texto con el
 * borde derecho del contenido; el relleno queda como área táctil.
 */
export const rowActionClass =
  "-mr-3 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-fg transition-colors hover:bg-brand-50 motion-reduce:transition-none";

/**
 * Hueso de un esqueleto: bloque gris que late solo si la persona no pidió
 * menos movimiento. Va dentro de un contenedor con la MISMA tipografía que el
 * texto real (`inline-block` + `align-middle`), así respeta su alto de línea.
 */
export const boneClass = "inline-block rounded-full bg-card-muted align-middle motion-safe:animate-pulse";
