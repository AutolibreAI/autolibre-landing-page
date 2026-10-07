/**
 * Tipo de negocio de schema.org según el rubro principal del proveedor
 * (`research.md` D9). Módulo PURO: sin imports.
 *
 * Las claves son los SLUGS de `service_categories` (nunca los nombres). Todo
 * slug desconocido cae en `AutomotiveBusiness`; la prueba
 * `business-type.test.ts` falla si una familia del catálogo no está mapeada,
 * para que una familia nueva nunca caiga en silencio al genérico.
 *
 * ATENCIÓN: los slugs de abajo salen de slugificar los nombres de las 16
 * familias; falta confirmarlos contra `GET /api/v1/service-catalog` real
 * (tarea T005, ver `scripts/provider-profile/fixtures/service-categories.json`).
 */

export type SchemaBusinessType =
  | "AutoRepair"
  | "TireShop"
  | "AutoWash"
  | "AutoBodyShop"
  | "AutoPartsStore"
  | "AutomotiveBusiness";

export const BUSINESS_TYPE_BY_CATEGORY: Readonly<Record<string, SchemaBusinessType>> = {
  motor: "AutoRepair",
  "electricidad-y-electronica": "AutoRepair",
  "tren-rodante-y-frenos": "AutoRepair",
  transmision: "AutoRepair",
  climatizacion: "AutoRepair",
  "neumaticos-y-llantas": "TireShop",
  estetica: "AutoWash",
  "carroceria-y-cristales": "AutoBodyShop",
  "repuestos-e-insumos": "AutoPartsStore",
  "accesorios-y-equipamiento": "AutoPartsStore",
  "tramites-y-documentacion": "AutomotiveBusiness",
  "asistencia-y-emergencias": "AutomotiveBusiness",
  "seguridad-y-rastreo": "AutomotiveBusiness",
  "seguros-y-siniestros": "AutomotiveBusiness",
  "compra-venta-y-valuacion": "AutomotiveBusiness",
  financiacion: "AutomotiveBusiness",
};

export function businessTypeFor(
  primaryCategorySlug: string | null | undefined,
): SchemaBusinessType {
  if (!primaryCategorySlug) return "AutomotiveBusiness";
  return BUSINESS_TYPE_BY_CATEGORY[primaryCategorySlug] ?? "AutomotiveBusiness";
}
