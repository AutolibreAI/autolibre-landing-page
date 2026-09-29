import type { VehicleLookupSnapshot } from "@/lib/vehicle-lookup";

/**
 * Lookup de patente desde el browser contra `/api/vehicle-lookup`, con el
 * polling de "todavía buscando". Lo comparten el modal de la home
 * (`use-quote-flow.ts`, botón "Buscar mi auto") y el form de `/pedido`
 * (validación de la patente al completarla). Un solo lugar para el ritmo del
 * polling: cada intento consume cuota de clasific.ar.
 *
 * clasific.ar no tiene un endpoint de "consultar estado" para la búsqueda
 * básica: cuando la patente no está en su base histórica, `onMiss=search` la
 * encola y hay que volver a pedir el MISMO endpoint más tarde. 4 reintentos
 * cada 4s (16s en total) porque cada uno manda `onMiss=search` de nuevo y
 * consume cuota `miss`: una ventana más larga agotaría esa cuota compartida
 * por poco beneficio.
 */
export const SEARCH_POLL_INTERVAL_MS = 4000;
export const SEARCH_POLL_MAX_ATTEMPTS = 4;

export type VehicleLookupOutcome =
  | {
      readonly kind: "found";
      readonly brand: string;
      readonly model: string;
      readonly year: number | null;
      /** Viaja con el pedido como `vehicleLookup`; null si la route no lo mandó. */
      readonly snapshot: VehicleLookupSnapshot | null;
    }
  | { readonly kind: "not_found" }
  | { readonly kind: "unavailable" }
  /** Se canceló con el `signal` (la patente cambió o el form se desmontó). */
  | { readonly kind: "aborted" };

type LookupOptions = {
  /** Cancela el fetch en curso y la espera entre reintentos. */
  readonly signal?: AbortSignal;
  /** Se llama antes de cada reintento: clasific.ar sigue buscando. */
  readonly onSearching?: () => void;
};

/** Espera cancelable: resuelve `false` si el signal se abortó. */
function wait(ms: number, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve(false);
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve(true);
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      resolve(false);
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Busca `plate` (ya normalizada) y resuelve con el resultado final. Nunca
 * tira: red caída o respuesta rara = `unavailable`; cancelado = `aborted`.
 */
export async function lookupVehicleFromBrowser(
  plate: string,
  { signal, onSearching }: LookupOptions = {},
): Promise<VehicleLookupOutcome> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetch(
        `/api/vehicle-lookup?plate=${encodeURIComponent(plate)}`,
        { signal },
      );
      const data = await response.json();

      if (data?.found) {
        return {
          kind: "found",
          brand: data.brand,
          model: data.model,
          year: data.year ?? null,
          snapshot: data.snapshot ?? null,
        };
      }

      if (data?.searching && attempt < SEARCH_POLL_MAX_ATTEMPTS) {
        onSearching?.();
        if (!(await wait(SEARCH_POLL_INTERVAL_MS, signal))) return { kind: "aborted" };
        continue;
      }

      return { kind: data?.error ? "unavailable" : "not_found" };
    } catch {
      return signal?.aborted ? { kind: "aborted" } : { kind: "unavailable" };
    }
  }
}
