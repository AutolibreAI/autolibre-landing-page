/**
 * Lo que el pedido de presupuesto guarda del lookup de clasific.ar. Viaja al
 * backend como `vehicleLookup` y queda en `raw_submission`, para que el
 * operador sepa qué auto es sin volver a gastar cuota consultándolo.
 *
 * Es un subconjunto EXPLÍCITO y no el payload crudo, a propósito: el backend
 * valida este objeto anidado con `forbidNonWhitelisted`, así que un campo
 * nuevo de clasific.ar reenviado tal cual haría fallar el alta con 400. Qué
 * campos pasan lo decide este borde, no el proveedor.
 *
 * Sin datos del titular: la consulta básica (`/v1/vehicles/basic`) no los
 * trae — `possibleOwners` sale solo de `/v1/reports`, que la landing no usa.
 */
export type VehicleLookupSnapshot = {
  /** La patente por la que se consultó, canónica. */
  queriedPlate: string;
  /**
   * Cuándo contestó clasific.ar, ISO 8601. Se fija al consultar y viaja
   * dentro de la cache: un resultado servido de cache conserva su hora real.
   */
  fetchedAt: string;
  make: string;
  model: string;
  year: number | null;
  /** Radicación del vehículo según el registro, no el domicilio de nadie. */
  currentLocation: { city: string | null; province: string | null } | null;
};

/** Mismos máximos que `QuoteRequestVehicleLookupDto` en autolibre-backend-hex. */
export const VEHICLE_LOOKUP_LIMITS = {
  make: 120,
  model: 200,
  locationArea: 120,
  minYear: 1900,
  maxYear: 2100,
} as const;
