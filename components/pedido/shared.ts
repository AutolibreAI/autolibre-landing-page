/**
 * Piezas compartidas por las secciones de `/pedido` (server) y sus dos islas
 * de cliente (`PedidoForm`, `PedidoStickyBar`). Sin JSX y sin "use client":
 * lo importan los dos mundos.
 *
 * Sin estilos propios: la escala (tipografía, botones, radios, contenedores,
 * ritmo de secciones) es la de la home — `SectionHeading`, `buttonVariants`,
 * `Container`, `Section`, `Card` y los controles de `form-controls.tsx`.
 */

/** Ids de la página. Las islas los buscan en el DOM que renderizó el server. */
export const PEDIDO_IDS = {
  heroTitle: "pedido-titulo",
  heroCtas: "pedido-ctas",
  form: "dejanos-tus-datos",
  formTitle: "dejanos-tus-datos-titulo",
  steps: "como-funciona",
  example: "asi-te-llega",
  faq: "preguntas-frecuentes",
  ctaBand: "pedido-cierre",
  footer: "pedido-pie",
} as const;

/**
 * Atributo de los botones "Quiero que me contacten" / "o dejanos tus datos".
 * Son `<button>` renderizados por el server, sin handler propio: `PedidoForm`
 * los escucha con un único listener delegado. Así ninguna sección se vuelve
 * client por un botón.
 */
export const OPEN_FORM_ATTR = "data-pedido-open-form";

/** Evento de `window` con `{ open: boolean }`: la vista del form mobile se abrió o cerró. */
export const FORM_TOGGLE_EVENT = "pedido:form-toggle";

export type FormToggleDetail = { readonly open: boolean };

/** Breakpoint `lg` de Tailwind (64rem): de acá para arriba el form es una tarjeta fija. */
export const LG_MEDIA_QUERY = "(min-width: 64rem)";
