import "server-only";
import type { VehicleLookupSnapshot } from "@/lib/vehicle-lookup";

/**
 * Consulta a clasific.ar por patente, detrás de `/api/vehicle-lookup`. Es el
 * ÚNICO lugar que la hace: el modal de la home ("Buscar mi auto") y el form
 * de `/pedido` (validación de la patente) la piden desde el browser, con el
 * polling de `lib/vehicle-lookup-client.ts`. `/api/presupuesto` no consulta:
 * recibe el snapshot que ya vio el browser.
 *
 * Nunca tira: cualquier falla (sin key, 429 de cupo, 403 de plan, timeout,
 * red) vuelve como `{ found: false, error: "unavailable" }`.
 */

const PLACEHOLDER_VALUES = new Set(["AUTOMOTOR", "DESCONOCIDO"]);

/** Filtra los placeholders que clasific.ar a veces devuelve en vez de un miss real. */
function identifiesVehicle(make: unknown, model: unknown): boolean {
  if (typeof make !== "string" || typeof model !== "string" || !make || !model) {
    return false;
  }
  return !PLACEHOLDER_VALUES.has(make.toUpperCase()) && !PLACEHOLDER_VALUES.has(model.toUpperCase());
}

function trimmedOrNull(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

function locationOf(raw: unknown): VehicleLookupSnapshot["currentLocation"] {
  if (!raw || typeof raw !== "object") return null;
  const { city, province } = raw as Record<string, unknown>;
  const location = { city: trimmedOrNull(city), province: trimmedOrNull(province) };
  return location.city || location.province ? location : null;
}

export type VehicleLookupResult =
  | {
      found: true;
      brand: string;
      model: string;
      year: number | null;
      /** Lo que el pedido guarda del lookup (ver lib/vehicle-lookup.ts). */
      snapshot: VehicleLookupSnapshot;
    }
  | { found: false; searching?: true }
  | { found: false; error: "unavailable" };

/**
 * Cache en memoria del proceso — no sobrevive un cold start serverless, pero
 * evita reconsultar clasific.ar (cupo diario compartido) por clicks
 * repetidos de la misma patente en la misma instancia. Suficiente para el
 * volumen de un MVP.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; body: VehicleLookupResult }>();

const UNAVAILABLE: VehicleLookupResult = { found: false, error: "unavailable" };

type LookupOptions = {
  /**
   * `onMiss=search`: si la patente no está en la base histórica, clasific.ar
   * la encola y hay que volver a preguntar más tarde (lo hace el browser con
   * polling). Consume cuota `miss`, así que quien no va a volver a preguntar
   * no lo pide.
   */
  readonly searchOnMiss?: boolean;
  /** Tope de espera; al vencer, `unavailable`. Sin tope por default. */
  readonly timeoutMs?: number;
};

/** `plate` tiene que venir canónica (ver `canonicalPlate` en lib/plate.ts). */
export async function lookupVehicle(
  plate: string,
  { searchOnMiss = true, timeoutMs }: LookupOptions = {},
): Promise<VehicleLookupResult> {
  const cached = cache.get(plate);
  if (cached && cached.expiresAt > Date.now()) return cached.body;

  const apiKey = process.env.CLASIFIC_API_KEY;
  const baseUrl = process.env.CLASIFIC_API_BASE_URL ?? "https://api.clasific.ar";
  if (!apiKey) return UNAVAILABLE;

  try {
    const response = await fetch(
      `${baseUrl}/v1/vehicles/basic?plate=${encodeURIComponent(plate)}&classification=true${searchOnMiss ? "&onMiss=search" : ""}`,
      {
        headers: { "x-api-key": apiKey },
        cache: "no-store",
        ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
      },
    );

    // 429 (cupo agotado) o 403 (plan) incluidos: nunca rompemos nada por esto.
    if (!response.ok) return UNAVAILABLE;

    const payload = await response.json();

    if (payload?.found === false) {
      const body: VehicleLookupResult = { found: false };
      cache.set(plate, { expiresAt: Date.now() + CACHE_TTL_MS, body });
      return body;
    }

    if (payload?.data === null && payload?.status?.state === "searching") {
      return { found: false, searching: true };
    }

    const data = payload?.data;
    if (!identifiesVehicle(data?.make, data?.model)) {
      const body: VehicleLookupResult = { found: false };
      cache.set(plate, { expiresAt: Date.now() + CACHE_TTL_MS, body });
      return body;
    }

    const year = typeof data.year === "number" ? data.year : null;
    const body: VehicleLookupResult = {
      found: true,
      brand: data.make,
      model: data.model,
      year,
      // `fetchedAt` se fija acá y viaja dentro de la cache: un hit de hasta
      // 5 min después devuelve la hora real de la consulta, no la del hit.
      snapshot: {
        queriedPlate: plate,
        fetchedAt: new Date().toISOString(),
        make: data.make,
        model: data.model,
        year,
        currentLocation: locationOf(data.currentLocation),
      },
    };
    cache.set(plate, { expiresAt: Date.now() + CACHE_TTL_MS, body });
    return body;
  } catch (error) {
    console.error("[vehicle-lookup] clasific.ar request failed", error);
    return UNAVAILABLE;
  }
}
