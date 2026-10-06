/**
 * Clases compartidas por las entradas de primer nivel del nav de desktop:
 * los links sueltos (server) y los botones de `NavDropdown` (client). Viven
 * en un módulo sin "use client" a propósito: un string exportado desde un
 * módulo client llega al server como referencia, no como valor.
 *
 * `min-h-11`: 44px de área táctil sin cambiar el alto del header.
 */
export const navEntryClass =
  "inline-flex min-h-11 items-center gap-1 rounded-field px-2.5 text-sm font-medium whitespace-nowrap text-ink/70 transition-colors hover:text-brand";

/**
 * Marca de "página actual" (link) o "contiene la página actual" (grupo):
 * color Y subrayado, porque el color solo no alcanza (WCAG 1.4.1).
 */
export const navEntryCurrentClass =
  "text-ink underline decoration-brand decoration-2 underline-offset-8";

/** La misma marca, aplicada por `aria-current="page"` en los links. */
export const navEntryAriaCurrentClass =
  "aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-brand aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8";
