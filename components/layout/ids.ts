/**
 * Ids del layout compartido que buscan las islas de cliente de las páginas
 * (p. ej. la barra fija de `/pedido` se esconde cuando se ve el footer). Sin
 * JSX: lo importan server y client sin arrastrar el componente.
 */
export const LAYOUT_IDS = {
  footer: "pie-del-sitio",
} as const;
