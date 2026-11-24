import { useCallback, useEffect, useRef, useState } from "react";
import {
  hidePlacesDropdownFromReplay,
  loadGooglePlaces,
  placeSelection,
  QUOTE_AUTOCOMPLETE_OPTIONS,
  type PlaceGeo,
} from "@/lib/google-places";
import { isValidPlate } from "@/lib/plate";
import type { VehicleLookupSnapshot } from "@/lib/vehicle-lookup";
import {
  lookupVehicleFromBrowser,
  type VehicleLookupOutcome,
} from "@/lib/vehicle-lookup-client";

/**
 * Lógica de cliente compartida por los dos forms de pedido que pegan a
 * `/api/presupuesto` con patente opcional: `PedidoForm` (`/pedido`) y el
 * módulo de pedido (`components/modulo-pedido`). Sin JSX y sin estilos: cada
 * form pinta lo suyo. Salió tal cual de `pedido-form.tsx` (mismo
 * comportamiento); solo se movió para no duplicarla.
 */

/**
 * Cuánto espera el envío a un lookup que todavía no terminó. Pasado esto el
 * pedido sale igual, sin el auto: la validación de la patente nunca bloquea.
 */
export const SUBMIT_LOOKUP_WAIT_MS = 5000;

/** Resuelve `null` si `promise` no terminó en `ms`. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

/** El dropdown de Google Places está abierto y con sugerencias. */
export function placesDropdownOpen(): boolean {
  return Array.from(document.querySelectorAll<HTMLElement>(".pac-container")).some(
    (el) => el.offsetParent !== null && el.querySelector(".pac-item") !== null,
  );
}

// ── Patente: lookup en clasific.ar ───────────────────────────────────────

/**
 * Estado visible del lookup de la patente. No se muestra el auto (marca y
 * modelo): solo si se pudo validar. El `snapshot` viaja con el pedido.
 */
export type PlateCheck =
  | { kind: "idle" }
  | { kind: "validating"; plate: string }
  | { kind: "valid"; plate: string }
  | { kind: "unverified"; plate: string };

/** El lookup en curso o terminado de UNA patente, fuera del render. */
type PlateLookup = {
  plate: string;
  controller: AbortController;
  promise: Promise<VehicleLookupOutcome>;
  outcome: VehicleLookupOutcome | null;
};

/**
 * Lookup de la patente contra clasific.ar (`/api/vehicle-lookup` + polling).
 * Arranca cuando el form lo pide (al salir del campo o al enviar); editar la
 * patente cancela lo que hubiera en curso y vuelve el estado a cero; nada
 * sigue vivo con el form desmontado.
 */
export function usePlateLookup(plate: string) {
  const [plateCheck, setPlateCheck] = useState<PlateCheck>({ kind: "idle" });
  const plateLookupRef = useRef<PlateLookup | null>(null);

  /**
   * Arranca (una vez por patente) el lookup de `value`, ya válida. Si había
   * otro en curso por una patente distinta, lo cancela: su resultado nunca
   * llega al estado. Devuelve la promesa, para que el envío pueda esperarla.
   */
  const startPlateLookup = useCallback((value: string): Promise<VehicleLookupOutcome> => {
    const current = plateLookupRef.current;
    if (current?.plate === value) return current.promise;
    current?.controller.abort();

    const controller = new AbortController();
    const lookup: PlateLookup = {
      plate: value,
      controller,
      outcome: null,
      promise: lookupVehicleFromBrowser(value, { signal: controller.signal }).then(
        (outcome) => {
          lookup.outcome = outcome;
          if (outcome.kind !== "aborted" && plateLookupRef.current === lookup) {
            setPlateCheck({
              kind: outcome.kind === "found" ? "valid" : "unverified",
              plate: value,
            });
          }
          return outcome;
        },
      ),
    };
    plateLookupRef.current = lookup;
    setPlateCheck({ kind: "validating", plate: value });
    return lookup.promise;
  }, []);

  // Editar la patente después cancela lo que hubiera en curso.
  useEffect(() => {
    const current = plateLookupRef.current;
    if (!current || current.plate === plate) return;
    current.controller.abort();
    plateLookupRef.current = null;
    setPlateCheck({ kind: "idle" });
  }, [plate]);

  // Ningún lookup (ni su polling) sigue vivo con el form desmontado.
  useEffect(() => () => plateLookupRef.current?.controller.abort(), []);

  /**
   * Lo que viaja como `vehicleLookup`: el snapshot del auto encontrado para
   * ESTA patente. Si el lookup sigue en curso lo espera, con tope; si no
   * terminó a tiempo, falló o no lo encontró, el pedido sale sin él.
   */
  const snapshotForSubmit = useCallback(
    async (plateValue: string): Promise<VehicleLookupSnapshot | undefined> => {
      if (!isValidPlate(plateValue)) return undefined;
      const outcome = await withTimeout(startPlateLookup(plateValue), SUBMIT_LOOKUP_WAIT_MS);
      if (outcome?.kind !== "found" || !outcome.snapshot) return undefined;
      return outcome.snapshot.queriedPlate === plateValue ? outcome.snapshot : undefined;
    },
    [startPlateLookup],
  );

  /** El pedido ya entró: si el lookup seguía con su polling, no hace falta. */
  const abortPlateLookup = useCallback(() => {
    plateLookupRef.current?.controller.abort();
  }, []);

  return { plateCheck, startPlateLookup, snapshotForSubmit, abortPlateLookup };
}

// ── Google Places: se carga recién al primer foco del campo de zona ───────

/**
 * Devuelve `ensurePlaces`, para el `onFocus`/`onPointerDown` del campo de
 * zona: la primera vez baja el script de Google Maps (`loadGooglePlaces`) y
 * engancha el Autocomplete a `inputRef`. Nada se descarga antes de que la
 * persona toque el campo. Al desmontar se suelta el listener y se borra el
 * `.pac-container`, que Google cuelga de `<body>` y no limpia solo.
 */
export function usePlacesAutocomplete(
  inputRef: React.RefObject<HTMLInputElement | null>,
  onSelect: (selection: { value: string; geo: PlaceGeo }) => void,
) {
  const placesRequestedRef = useRef(false);
  const placesListenerRef = useRef<{ remove: () => void } | null>(null);
  // El callback más reciente, sin re-enganchar el Autocomplete.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(
    () => () => {
      placesListenerRef.current?.remove();
      document.querySelectorAll(".pac-container").forEach((el) => el.remove());
    },
    [],
  );

  return useCallback(() => {
    if (placesRequestedRef.current) return;
    placesRequestedRef.current = true;
    loadGooglePlaces().then((ready) => {
      const input = inputRef.current;
      if (!ready || !input || !window.google?.maps?.places) {
        // Sin key o sin red: el campo sigue siendo texto libre. Se deja
        // reintentar en el próximo foco.
        placesRequestedRef.current = false;
        return;
      }
      if (placesListenerRef.current) return;
      const autocomplete = new window.google.maps.places.Autocomplete(
        input,
        QUOTE_AUTOCOMPLETE_OPTIONS,
      );
      hidePlacesDropdownFromReplay();
      placesListenerRef.current = autocomplete.addListener("place_changed", () => {
        const selection = placeSelection(autocomplete.getPlace());
        if (selection) onSelectRef.current(selection);
      });
    });
  }, [inputRef]);
}

// ── Envío a `/api/presupuesto` ─────────────────────────────────────────────

export type QuoteRequestResult =
  | {
      readonly ok: true;
      /** Código público del pedido, sin `#` (`AL-1042`). `null` si no vino. */
      readonly publicCode: string | null;
    }
  | { readonly ok: false; readonly reason: "network" }
  | {
      readonly ok: false;
      readonly reason: "server";
      readonly status: number;
      /** Mensaje de la route, si mandó uno. */
      readonly message: string | null;
    };

/**
 * `POST /api/presupuesto` con el body ya armado. No mide nada: el form decide
 * qué eventos mandar según el resultado.
 */
export async function postQuoteRequest(body: Record<string, unknown>): Promise<QuoteRequestResult> {
  let response: Response;
  let data: { error?: unknown; publicCode?: unknown } | null;
  try {
    response = await fetch("/api/presupuesto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    data = await response.json().catch(() => null);
  } catch {
    return { ok: false, reason: "network" };
  }

  if (!response.ok) {
    return {
      ok: false,
      reason: "server",
      status: response.status,
      message: typeof data?.error === "string" && data.error ? data.error : null,
    };
  }

  return {
    ok: true,
    publicCode:
      typeof data?.publicCode === "string" && data.publicCode.trim()
        ? data.publicCode.trim().replace(/^#+/, "")
        : null,
  };
}
