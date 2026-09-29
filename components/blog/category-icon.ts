import type { IconName } from "@/lib/content/types";

/**
 * Ícono de cada categoría para las portadas sin imagen. Las categorías salen
 * de Hygraph, así que el mapa es por slug y una categoría nueva cae en el
 * default (`document`) en vez de romper.
 */
const icons: Record<string, IconName> = {
  vencimientos: "bell",
  documentacion: "document",
  mantenimiento: "car",
  diagnostico: "info",
  talleres: "pin",
};

export function categoryIcon(slug: string): IconName {
  return icons[slug] ?? "document";
}
