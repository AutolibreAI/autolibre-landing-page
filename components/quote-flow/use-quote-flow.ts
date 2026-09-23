"use client";

import { useEffect, useRef, useState } from "react";
import {
  createMetaEventId,
  META_CUSTOM_EVENTS,
  META_EVENTS,
  trackMetaCustomEvent,
  trackMetaEvent,
} from "@/lib/analytics/meta-pixel";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { isValidPlate, normalizePlateInput, PLATE_PATTERNS } from "@/lib/plate";
import { isValidArWhatsapp } from "@/lib/phone";
import { EMAIL_REGEX, whatsappDigitCount } from "@/lib/validation";
import { whatsappUrl } from "@/lib/whatsapp";
import type { VehicleLookupSnapshot } from "@/lib/vehicle-lookup";
import { lookupVehicleFromBrowser } from "@/lib/vehicle-lookup-client";
import {
  EMPTY_GEO,
  GOOGLE_MAPS_API_KEY,
  placeSelection,
  QUOTE_AUTOCOMPLETE_OPTIONS,
  type PlaceGeo,
} from "@/lib/google-places";

// Re-exportados para no romper a quien ya importa estos nombres desde acá
// (ver components/quote-flow/index.ts). La fuente de verdad de estos tipos y
// helpers de Google Places es `lib/google-places.ts`, compartida con
// `provider-form.tsx`.
export { EMPTY_GEO, GOOGLE_MAPS_API_KEY };
export type { PlaceGeo };

// Helpers puros compartidos con `/pedido` y las rutas de servidor: viven en
// `lib/plate.ts` y `lib/validation.ts`. Se re-exportan para no romper a quien
// ya los importa desde acá.
export { isValidPlate, normalizePlateInput, PLATE_PATTERNS, whatsappDigitCount };

/**
 * `siteConfig.contact.whatsapp` es el link genérico del sitio (footer, FAQ) y
 * su texto precargado es de otro contexto ("Me interesa comprar un
 * escáner!") — no sirve para el fallback del pedido de presupuesto. Se arma
 * un link propio con el mismo número pero un mensaje que tiene sentido acá.
 * El número y el formato de wa.me los resuelve `whatsappUrl`.
 */
const PRESUPUESTO_WHATSAPP_TEXT =
  "¡Hola! Hice un pedido de presupuesto en la web de AutoLibre.";
export const PRESUPUESTO_WHATSAPP_URL = whatsappUrl(PRESUPUESTO_WHATSAPP_TEXT);

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
  // Lookup en curso (fetch + polling). Abortarlo corta el fetch y la espera
  // entre reintentos: ver `lib/vehicle-lookup-client.ts`.
  const lookupAbortRef = useRef<AbortController | null>(null);
  // `QuoteStart` sale una sola vez por instancia del flujo: volver al paso 1
  // y avanzar de nuevo no lo repite. Ref y no estado (no pinta nada), y
  // `reset()` no lo toca a propósito: sigue siendo la misma persona.
  const quoteStartTrackedRef = useRef(false);
  // `PedidoPaso` por paso visto, con la misma regla: una vez por paso y por
  // instancia (ir y volver no lo repite, `reset()` tampoco lo limpia).
  const trackedStepsRef = useRef<Set<number>>(new Set());

  // El hook vive en `QuoteFlow`, que en la home se monta recién al abrir el
  // modal (y se desmonta al cerrarlo): el paso 1 sale cuando el flujo se ve,
  // no al cargar la página. En `/pedido` el flujo está a la vista de entrada.
  useEffect(() => {
    if (trackedStepsRef.current.has(step)) return;
    trackedStepsRef.current.add(step);
    trackMetaCustomEvent(META_CUSTOM_EVENTS.quoteStep, { step });
  }, [step]);

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

    // Opciones compartidas con `/pedido`: zona/localidad, no calle y altura.
    const autocomplete = new window.google.maps.places.Autocomplete(
      input,
      QUOTE_AUTOCOMPLETE_OPTIONS,
    );

    const listener = autocomplete.addListener("place_changed", () => {
      const selection = placeSelection(autocomplete.getPlace());
      if (!selection) return;
      setAddressState(selection.value);
      setGeo(selection.geo);
    });

    return () => {
      listener.remove();
      document.querySelectorAll(".pac-container").forEach((el) => el.remove());
    };
  }, [mapsReady, step]);

  function clearLookupPoll() {
    lookupAbortRef.current?.abort();
    lookupAbortRef.current = null;
  }

  // Ningun lookup ni polling puede seguir vivo despues de que el flujo se
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
   * Click de "Buscar mi auto". El polling mientras clasific.ar sigue buscando
   * vive en `lookupVehicleFromBrowser` (compartido con `/pedido`). La patente
   * va fija por clausura: si la persona la edita a mitad de un poll,
   * `setPlate` aborta este lookup y su resultado nunca llega al estado.
   */
  async function runLookup(plateToQuery: string = plate) {
    clearLookupPoll();
    const controller = new AbortController();
    lookupAbortRef.current = controller;
    setLookup({ kind: "loading" });
    const outcome = await lookupVehicleFromBrowser(plateToQuery, {
      signal: controller.signal,
      onSearching: () => setLookup({ kind: "searching" }),
    });
    if (outcome.kind === "aborted" || controller.signal.aborted) return;
    lookupAbortRef.current = null;
    setLookup(outcome);
  }

  /**
   * Paso 1 completado = pasar al paso 2, por cualquiera de las dos salidas:
   * confirmar el auto encontrado o seguir sin él (no encontrado / servicio
   * caído). Encontrar el auto solo no alcanza: la persona todavía puede
   * decir "no es mi auto". Sin params: nada de patente ni datos personales.
   */
  function completePlateStep() {
    if (!quoteStartTrackedRef.current) {
      quoteStartTrackedRef.current = true;
      trackMetaCustomEvent(META_CUSTOM_EVENTS.quoteStart);
    }
    setStep(2);
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
    isValidArWhatsapp(whatsapp) && emailValid && addressValid;
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
      completePlateStep();
    },
    rejectVehicle() {
      setLookup({ kind: "idle" });
    },
    continueAnyway() {
      completePlateStep();
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
