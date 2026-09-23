"use client";

import { useEffect, useRef, useState } from "react";
import { createMetaEventId, META_EVENTS, trackMetaEvent } from "@/lib/analytics/meta-pixel";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { EMAIL_REGEX } from "@/lib/validation";
import { siteConfig } from "@/lib/seo/config";
import type { VehicleLookupSnapshot } from "@/lib/vehicle-lookup";
import {
  EMPTY_GEO,
  findAddressComponent,
  GOOGLE_MAPS_API_KEY,
  type PlaceGeo,
} from "@/lib/google-places";

// Re-exportados para no romper a quien ya importa estos nombres desde acá
// (ver components/quote-flow/index.ts). La fuente de verdad de estos tipos y
// helpers de Google Places es `lib/google-places.ts`, compartida con
// `provider-form.tsx`.
export { EMPTY_GEO, GOOGLE_MAPS_API_KEY };
export type { PlaceGeo };

export const PLATE_PATTERNS: readonly RegExp[] = [
  /^[A-Z]{3}\d{3}$/, // auto legacy   - ABC123
  /^[A-Z]{2}\d{3}[A-Z]{2}$/, // auto Mercosur - AB123CD
  /^\d{3}[A-Z]{3}$/, // moto legacy   - 123ABC
  /^[A-Z]\d{3}[A-Z]{3}$/, // moto Mercosur - A123BCD
];

export function isValidPlate(value: string): boolean {
  return PLATE_PATTERNS.some((pattern) => pattern.test(value));
}

export function normalizePlateInput(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}

export function whatsappDigitCount(raw: string): number {
  return raw.replace(/\D/g, "").length;
}

/**
 * `siteConfig.contact.whatsapp` es el link genérico del sitio (footer, FAQ) y
 * su texto precargado es de otro contexto ("Me interesa comprar un
 * escáner!") — no sirve para el fallback del pedido de presupuesto. Se arma
 * un link propio con el mismo número pero un mensaje que tiene sentido acá.
 * wa.me solo acepta dígitos: sin `+`, sin espacios y sin guiones.
 */
const PRESUPUESTO_WHATSAPP_TEXT =
  "¡Hola! Hice un pedido de presupuesto en la web de AutoLibre.";
export const PRESUPUESTO_WHATSAPP_URL = `https://wa.me/${siteConfig.contact.phoneE164.replace(/\D/g, "")}?text=${encodeURIComponent(PRESUPUESTO_WHATSAPP_TEXT)}`;

export const TOTAL_STEPS = 4;
const copy = presupuestoContent.modal;

export type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "searching" }
  | {
      kind: "found";
      brand: string;
      model: string;
      year: number | null;
      /** Viaja con el pedido; null si la route no lo mandó. */
      snapshot: VehicleLookupSnapshot | null;
    }
  | { kind: "not_found" }
  | { kind: "unavailable" };

/**
 * clasific.ar no tiene un endpoint de "consultar estado" para la búsqueda
 * básica (a diferencia de Modules/Reports, que sí lo tienen): cuando la
 * patente no está en su base histórica, `onMiss=search` la encola y hay que
 * volver a pedir el MISMO endpoint más tarde para ver si ya apareció. 4
 * intentos cada 4s (16s totales) porque cada reintento manda `onMiss=search`
 * de nuevo y consume cuota `miss` — una ventana más larga agotaría esa cuota
 * compartida por poco beneficio.
 */
const SEARCH_POLL_INTERVAL_MS = 4000;
const SEARCH_POLL_MAX_ATTEMPTS = 4;

export type SubmitState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; id: string }
  | { kind: "error"; message: string };

/** UTMs / referrer / campaña con los que llegó la persona al flujo. */
export type QuoteFlowAttribution = Record<string, string>;

export type QuoteFlowController = {
  // ── Estado ──
  readonly step: number;
  readonly totalSteps: number;
  readonly plate: string;
  readonly lookup: LookupState;
  readonly whatsapp: string;
  readonly address: string;
  readonly addressTouched: boolean;
  readonly geo: PlaceGeo;
  readonly email: string;
  readonly description: string;
  readonly consent: boolean;
  readonly submitState: SubmitState;
  readonly mapsReady: boolean;

  readonly addressInputRef: React.RefObject<HTMLInputElement | null>;

  // ── Derivados ──
  readonly canSearchPlate: boolean;
  readonly emailValid: boolean;
  readonly addressValid: boolean;
  readonly canContinueFromContact: boolean;
  readonly canContinueFromNeed: boolean;

  // ── Acciones ──
  readonly setPlate: (value: string) => void;
  readonly setWhatsapp: (value: string) => void;
  readonly setAddress: (value: string) => void;
  readonly markAddressTouched: () => void;
  readonly setEmail: (value: string) => void;
  readonly setDescription: (value: string) => void;
  readonly setConsent: (value: boolean) => void;
  readonly searchPlate: () => void;
  readonly confirmVehicle: () => void;
  readonly rejectVehicle: () => void;
  readonly continueAnyway: () => void;
  readonly goBack: () => void;
  readonly goNext: () => void;
  readonly submit: () => void;
  readonly reset: () => void;
  /** La carga del script de Google Maps la dispara quien renderiza el flujo. */
  readonly markMapsReady: () => void;
};

/**
 * Todo el flujo de pedido de presupuesto sin una sola decisión de chrome:
 * no sabe si vive en un modal o en una página. Los 4 pasos, el lookup de
 * patente contra clasific.ar, el Autocomplete de Google Places y el submit
 * viven acá; quien lo consume solo pinta.
 */
export function useQuoteFlow(options?: {
  attribution?: QuoteFlowAttribution;
}): QuoteFlowController {
  const [step, setStep] = useState(1);
  const [plate, setPlateState] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ kind: "idle" });
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddressState] = useState("");
  const [addressTouched, setAddressTouched] = useState(false);
  const [geo, setGeo] = useState<PlaceGeo>(EMPTY_GEO);
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });
  const [mapsReady, setMapsReady] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // En un ref y no en estado: la atribución no pinta nada, no tiene que
  // provocar un render, y tiene que sobrevivir a un `reset()`.
  const attributionRef = useRef<QuoteFlowAttribution>(
    options?.attribution ?? {},
  );
  const attribution = options?.attribution;
  useEffect(() => {
    if (attribution) attributionRef.current = attribution;
  }, [attribution]);

  // El input de direccion se monta y desmonta con el step (cada paso es su
  // propio <form>), asi que el Autocomplete se reengancha cada vez que se
  // vuelve al paso 2. `.pac-container` es el listbox que Google cuelga de
  // <body> (no del input) y no lo limpia solo al sacar el input del DOM.
  useEffect(() => {
    if (!mapsReady || step !== 2) return;
    const input = addressInputRef.current;
    if (!input || !window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: "ar" },
      // Pedimos zona/localidad, no la calle y altura: "(regions)" agrupa
      // barrio, localidad, partido y provincia, y saca las sugerencias de
      // direcciones puntuales que el widget mostraría por default.
      types: ["(regions)"],
      fields: ["formatted_address", "name", "geometry", "address_components"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const value = place.formatted_address ?? place.name;
      if (!value) return;

      setAddressState(value);
      setGeo({
        latitude: place.geometry?.location?.lat() ?? null,
        longitude: place.geometry?.location?.lng() ?? null,
        locality:
          findAddressComponent(place.address_components, "locality") ??
          findAddressComponent(place.address_components, "sublocality"),
        province: findAddressComponent(
          place.address_components,
          "administrative_area_level_1",
        ),
      });
    });

    return () => {
      listener.remove();
      document.querySelectorAll(".pac-container").forEach((el) => el.remove());
    };
  }, [mapsReady, step]);

  function clearLookupPoll() {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }

  // Ningun timeout de polling puede seguir vivo despues de que el flujo se
  // desmonta (ej. el modal se cierra, o la persona navega a otra pagina).
  useEffect(() => clearLookupPoll, []);

  function reset() {
    clearLookupPoll();
    setStep(1);
    setPlateState("");
    setLookup({ kind: "idle" });
    setWhatsapp("");
    setAddressState("");
    setAddressTouched(false);
    setGeo(EMPTY_GEO);
    setEmail("");
    setDescription("");
    setConsent(false);
    setSubmitState({ kind: "idle" });
  }

  /**
   * `attempt` 0 es el click de "Buscar mi auto"; los siguientes son los
   * reintentos automaticos mientras clasific.ar todavia esta buscando la
   * patente (ver SEARCH_POLL_MAX_ATTEMPTS). `plateToQuery` va fijo por
   * clausura y no se relee de `plate`: si la persona edita la patente a mitad
   * de un poll, ese poll tiene que seguir preguntando por la de antes o el
   * resultado le llegaria pegado al campo equivocado.
   */
  async function runLookup(plateToQuery: string = plate, attempt = 0) {
    clearLookupPoll();
    setLookup({ kind: attempt === 0 ? "loading" : "searching" });
    try {
      const response = await fetch(
        `/api/vehicle-lookup?plate=${encodeURIComponent(plateToQuery)}`,
      );
      const data = await response.json();

      if (data.found) {
        setLookup({
          kind: "found",
          brand: data.brand,
          model: data.model,
          year: data.year ?? null,
          snapshot: data.snapshot ?? null,
        });
        return;
      }

      if (data.searching && attempt < SEARCH_POLL_MAX_ATTEMPTS) {
        setLookup({ kind: "searching" });
        pollTimeoutRef.current = setTimeout(() => {
          runLookup(plateToQuery, attempt + 1);
        }, SEARCH_POLL_INTERVAL_MS);
        return;
      }

      setLookup({ kind: data.error ? "unavailable" : "not_found" });
    } catch {
      setLookup({ kind: "unavailable" });
    }
  }

  async function handleSubmit() {
    setSubmitState({ kind: "loading" });
    // Mismo ID para el `Lead` del Pixel y el de la Conversions API (lo manda
    // la route): así Meta cuenta un solo lead aunque le lleguen los dos.
    const metaEventId = createMetaEventId();
    try {
      const response = await fetch("/api/presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate,
          description,
          contactPhone: whatsapp,
          address,
          // Solo van si vinieron de una sugerencia elegida en el
          // Autocomplete: `geo` se resetea apenas la persona edita el texto
          // a mano (ver el onChange del input), asi que nunca se manda una
          // coordenada que no matchea la direccion final.
          latitude: geo.latitude,
          longitude: geo.longitude,
          locality: geo.locality,
          province: geo.province,
          contactEmail: email || undefined,
          consent,
          // Solo con el auto confirmado: `rejectVehicle` y editar la patente
          // devuelven el lookup a `idle`, y con not_found / unavailable /
          // searching el pedido entra igual, sin este campo.
          vehicleLookup:
            lookup.kind === "found"
              ? (lookup.snapshot ?? undefined)
              : undefined,
          // Lo consume la route para la Conversions API; al backend no llega.
          metaEventId,
          // TODO(attribution): los UTMs viajan en `attributionRef.current` y están listos para
          // mandarse acá. Bloqueado: el DTO del backend usa forbidNonWhitelisted, así que un campo
          // desconocido devuelve 400. Requiere agregar el campo en
          // autolibre-backend-hex/src/quotes/quote-request/presentation/dtos/create-quote-request.dto.ts
          // y propagarlo en app/api/presupuesto/route.ts. NO meterlo en `description` ni en `contactName`.
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? copy.genericError);
      trackMetaEvent(META_EVENTS.lead, undefined, metaEventId);
      setSubmitState({ kind: "success", id: data.id });
    } catch (error) {
      setSubmitState({
        kind: "error",
        message:
          error instanceof Error && error.message
            ? error.message
            : copy.genericError,
      });
    }
  }

  const canSearchPlate = isValidPlate(plate);
  const emailValid = email === "" || EMAIL_REGEX.test(email);
  const addressValid = address.trim().length > 0;
  const canContinueFromContact =
    whatsappDigitCount(whatsapp) >= 8 && emailValid && addressValid;
  const canContinueFromNeed = description.trim().length > 0;

  return {
    step,
    totalSteps: TOTAL_STEPS,
    plate,
    lookup,
    whatsapp,
    address,
    addressTouched,
    geo,
    email,
    description,
    consent,
    submitState,
    mapsReady,

    addressInputRef,

    canSearchPlate,
    emailValid,
    addressValid,
    canContinueFromContact,
    canContinueFromNeed,

    setPlate(value) {
      // Editar la patente mata el poll en curso y borra el resultado: lo que
      // se ve en el campo y lo que se ve en la tarjeta no pueden divergir.
      clearLookupPoll();
      setPlateState(normalizePlateInput(value));
      setLookup({ kind: "idle" });
    },
    setWhatsapp,
    setAddress(value) {
      setAddressState(value);
      // Editar a mano invalida el geocode anterior: sin esto, tocar la
      // direccion elegida (agregar un depto, por ej.) mandaria coordenadas
      // que ya no corresponden a lo que se ve en el input.
      setGeo(EMPTY_GEO);
    },
    markAddressTouched() {
      setAddressTouched(true);
    },
    setEmail,
    setDescription,
    setConsent,
    searchPlate() {
      runLookup();
    },
    confirmVehicle() {
      setStep(2);
    },
    rejectVehicle() {
      setLookup({ kind: "idle" });
    },
    continueAnyway() {
      setStep(2);
    },
    goBack() {
      setStep((current) => Math.max(1, current - 1));
    },
    goNext() {
      setStep((current) => Math.min(TOTAL_STEPS, current + 1));
    },
    submit() {
      handleSubmit();
    },
    reset,
    markMapsReady() {
      setMapsReady(true);
    },
  };
}
