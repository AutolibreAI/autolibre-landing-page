/**
 * Regla de indexabilidad de un perfil (`data-model.md §3.9`). Módulo PURO.
 *
 * Verdadero solo si hay descripción, al menos un servicio, horarios
 * estructurados y (dirección o zona de cobertura). Falso → `noindex`, fuera
 * del sitemap y sin datos estructurados de negocio: un perfil pobre no se
 * indexa. El interruptor global `PROVIDER_PROFILES_PUBLIC` manda por encima.
 */

export type IndexabilityInput = {
  readonly description: string | null;
  readonly services: readonly { readonly items: readonly unknown[] }[];
  readonly businessHours: readonly { readonly ranges: readonly unknown[] }[] | null;
  readonly address: { readonly full: string } | null;
  readonly serviceArea: { readonly localities: readonly unknown[] } | null;
};

export function isIndexable(profile: IndexabilityInput): boolean {
  const hasDescription = (profile.description ?? "").trim().length > 0;
  const hasService = profile.services.some((group) => group.items.length > 0);
  const hasHours = (profile.businessHours ?? []).some(
    (day) => day.ranges.length > 0,
  );
  const hasPlace =
    (profile.address?.full ?? "").trim().length > 0 ||
    (profile.serviceArea?.localities.length ?? 0) > 0;
  return hasDescription && hasService && hasHours && hasPlace;
}
