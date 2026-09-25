"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  FIELD_STATUS_PADDING,
  FieldStatusIcon,
  type FieldStatus,
} from "@/components/ui/field-status-icon";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { FormError } from "@/components/ui/form-feedback";
import { Icon } from "@/components/ui/icon";
import { WhatsappInput } from "@/components/ui/whatsapp-input";
import {
  createMetaEventId,
  META_CUSTOM_EVENTS,
  META_EVENTS,
  META_LEAD_SOURCES,
  trackMetaCustomEvent,
  trackMetaEvent,
} from "@/lib/analytics/meta-pixel";
import { presupuestoContent, whatsappErrorMessage } from "@/lib/content/presupuesto";
import {
  EMPTY_GEO,
  loadGooglePlaces,
  placeSelection,
  QUOTE_AUTOCOMPLETE_OPTIONS,
  type PlaceGeo,
} from "@/lib/google-places";
import { parseArWhatsapp } from "@/lib/phone";
import { isValidPlate, normalizePlateInput } from "@/lib/plate";
import { cn } from "@/lib/utils";
import type { VehicleLookupSnapshot } from "@/lib/vehicle-lookup";
import {
  lookupVehicleFromBrowser,
  type VehicleLookupOutcome,
} from "@/lib/vehicle-lookup-client";
import { whatsappUrl } from "@/lib/whatsapp";
import {
  FORM_TOGGLE_EVENT,
  LG_MEDIA_QUERY,
  OPEN_FORM_ATTR,
  PEDIDO_IDS,
  type FormToggleDetail,
} from "./shared";
import { WhatsappLink } from "./whatsapp-link";
// Estilos del dropdown de Google Places. CSS global porque Google cuelga el
// listbox de <body>, fuera del árbol de React. Solo lo importa esta isla.
import "@/components/quote-flow/places-autocomplete.css";

const { form: copy, confirmation: done, header } = presupuestoContent.pedidoPage;

type FieldName = "zona" | "problema" | "patente" | "whatsapp";
type FieldValues = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName, string>>;

/** Orden visual: el primer campo inválido en este orden es el que recibe el foco. */
const FIELD_ORDER: readonly FieldName[] = ["problema", "zona", "patente", "whatsapp"];

const FIELD_IDS: Record<FieldName, string> = {
  zona: "pedido-zona",
  problema: "pedido-problema",
  patente: "pedido-patente",
  whatsapp: "pedido-whatsapp",
};

const EMPTY_VALUES: FieldValues = { zona: "", problema: "", patente: "", whatsapp: "" };

/**
 * Campos que se validan al salir (blur) y no solo al enviar: los que tienen
 * formato. Zona y problema solo pueden estar vacíos, y marcarlos en rojo al
 * pasar de largo con Tab es ruido.
 */
const VALIDATE_ON_BLUR: readonly FieldName[] = ["patente", "whatsapp"];

/**
 * Cuánto espera el envío a un lookup que todavía no terminó. Pasado esto el
 * pedido sale igual, sin el auto: la validación de la patente nunca bloquea.
 */
const SUBMIT_LOOKUP_WAIT_MS = 5000;

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | {
      kind: "success";
      /** Código público del pedido, sin `#` (`AL-1042`). `null` si no vino. */
      publicCode: string | null;
      zona: string;
      plate: string;
    };

/**
 * Estado visible del lookup de la patente. No se muestra el auto (marca y
 * modelo): solo si se pudo validar. El `snapshot` viaja con el pedido.
 */
type PlateCheck =
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

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function validate(values: FieldValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.zona.trim()) errors.zona = copy.fields.zona.error;
  if (!values.problema.trim()) errors.problema = copy.fields.problema.error;
  if (values.patente && !isValidPlate(values.patente)) {
    errors.patente = copy.fields.patente.error;
  }
  const phone = parseArWhatsapp(values.whatsapp);
  if (!phone.ok) errors.whatsapp = whatsappErrorMessage(phone.error, phone.diff);
  return errors;
}

/** El dropdown de Google Places está abierto y con sugerencias. */
function placesDropdownOpen(): boolean {
  return Array.from(document.querySelectorAll<HTMLElement>(".pac-container")).some(
    (el) => el.offsetParent !== null && el.querySelector(".pac-item") !== null,
  );
}

/** Resuelve `null` si `promise` no terminó en `ms`. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
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

/**
 * Único `"use client"` con peso de `/pedido`: el form, su vista a pantalla
 * completa en mobile y la confirmación. Todo el resto de la página es server.
 *
 * UNA sola instancia del form (sin ids duplicados) con dos presentaciones:
 *
 * - `lg+`: tarjeta fija en la columna derecha del hero.
 * - mobile: oculto hasta que alguien toca "Quiero que me contacten" (cualquier
 *   botón con `data-pedido-open-form`). Ahí la misma sección pasa a ser una
 *   vista a pantalla completa (`role="dialog"`) con un `history.pushState`,
 *   para que el "atrás" del teléfono la cierre en vez de sacar a la persona
 *   de la página. Foco al título al abrir, de vuelta al botón al cerrar,
 *   Escape cierra y el scroll de la página queda frenado mientras tanto.
 *
 * Controles, labels, botones y tipografía son los del resto del sitio
 * (`Field`/`Input`/`Textarea`, `buttonVariants`, `FormError`): la escala es
 * la de la home.
 *
 * Patente: cuando queda completa y válida, se valida contra clasific.ar con
 * el mismo lookup del modal (`/api/vehicle-lookup` + polling). El resultado
 * no se muestra (nada de marca ni modelo): solo "Validando…", "Patente
 * validada" o "No pudimos validarla". Con el auto encontrado, el snapshot
 * viaja como `vehicleLookup`, igual que desde el modal.
 *
 * Next: el `pushState` sin URL es seguro con el App Router. Su parche copia
 * el estado interno (`__NA`) a la entrada nueva, así que el `popstate` al
 * volver no recarga la página (sin `__NA` la recargaría).
 */
export function PedidoForm() {
  const [values, setValues] = useState<FieldValues>(EMPTY_VALUES);
  const [geo, setGeo] = useState<PlaceGeo>(EMPTY_GEO);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [plateCheck, setPlateCheck] = useState<PlateCheck>({ kind: "idle" });
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const zonaRef = useRef<HTMLInputElement>(null);
  const problemaRef = useRef<HTMLTextAreaElement>(null);
  const patenteRef = useRef<HTMLInputElement>(null);
  const whatsappRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const pushedRef = useRef(false);
  const openRef = useRef(false);
  const quoteStartTrackedRef = useRef(false);
  const placesRequestedRef = useRef(false);
  const placesListenerRef = useRef<{ remove: () => void } | null>(null);
  const plateLookupRef = useRef<PlateLookup | null>(null);

  const fieldRefs: Record<FieldName, React.RefObject<HTMLElement | null>> = {
    zona: zonaRef,
    problema: problemaRef,
    patente: patenteRef,
    whatsapp: whatsappRef,
  };

  // Errores derivados: un campo muestra el suyo después del primer intento de
  // envío o, si valida al salir, después de su primer blur. Desde ahí se
  // corrige en vivo mientras la persona escribe.
  const allErrors = validate(values);
  const errors: FieldErrors = {};
  for (const name of FIELD_ORDER) {
    if (allErrors[name] && (attempted || touched[name])) errors[name] = allErrors[name];
  }

  // ── Vista mobile: abrir / cerrar ───────────────────────────────────────

  const openForm = useCallback((trigger: HTMLElement | null) => {
    // Desktop: la tarjeta ya está a la vista (o arriba): se la lleva a
    // pantalla y se enfoca el primer campo. Nada de history ni de overlay.
    if (window.matchMedia(LG_MEDIA_QUERY).matches) {
      rootRef.current?.scrollIntoView({ block: "center" });
      const target = problemaRef.current ?? headingRef.current;
      target?.focus({ preventScroll: true });
      return;
    }
    if (openRef.current) return;
    triggerRef.current = trigger;
    window.history.pushState({ pedidoForm: true }, "");
    pushedRef.current = true;
    openRef.current = true;
    setOpen(true);
  }, []);

  /** Cierra desde la UI (flecha, Escape): vuelve la entrada del historial. */
  const requestClose = useCallback(() => {
    if (!openRef.current) return;
    if (pushedRef.current) {
      // El `popstate` que dispara esto es el que cierra de verdad.
      window.history.back();
      return;
    }
    openRef.current = false;
    setOpen(false);
  }, []);

  // Delegado: cualquier botón con `data-pedido-open-form` de la página.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest<HTMLElement>(`[${OPEN_FORM_ATTR}]`);
      if (!trigger) return;
      event.preventDefault();
      openForm(trigger);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openForm]);

  // El "atrás" del teléfono o del navegador cierra la vista.
  useEffect(() => {
    function onPopState() {
      if (!openRef.current) return;
      pushedRef.current = false;
      openRef.current = false;
      setOpen(false);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Mientras está abierta: scroll frenado, Escape, foco atrapado, y cierre
  // si la ventana pasa a desktop (ahí el form es la tarjeta, no una vista).
  useEffect(() => {
    if (!open) return;
    // En `<html>` y NO en `<body>` (mismo criterio que `MobileNav`): como
    // `<html>` tiene `overflow-x: hidden`, un `overflow` en el body no llega
    // al viewport, vuelve al body un contenedor de scroll propio y despega el
    // header sticky del sitio.
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        // Con el dropdown de Places abierto, Escape es para cerrar ESE.
        if (placesDropdownOpen()) return;
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab" || !rootRef.current) return;
      const focusables = Array.from(
        rootRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = rootRef.current.contains(active);
      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    }

    const desktop = window.matchMedia(LG_MEDIA_QUERY);
    function onMediaChange() {
      if (desktop.matches) requestClose();
    }

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onMediaChange);
    return () => {
      root.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onMediaChange);
    };
  }, [open, requestClose]);

  // Foco: al título al abrir; de vuelta al botón que la abrió al cerrar.
  // Y aviso a la barra fija para que se esconda mientras la vista está arriba.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent<FormToggleDetail>(FORM_TOGGLE_EVENT, { detail: { open } }),
    );
    if (open) {
      rootRef.current?.scrollTo({ top: 0 });
      headingRef.current?.focus();
    } else if (wasOpenRef.current) {
      // Un frame después: si el botón era el de la barra fija, la barra
      // todavía está `inert` hasta que procese el aviso de arriba.
      const trigger = triggerRef.current;
      triggerRef.current = null;
      requestAnimationFrame(() => trigger?.focus({ preventScroll: true }));
    }
    wasOpenRef.current = open;
  }, [open]);

  // La confirmación reemplaza al form: el foco va a su título, que se lee.
  useEffect(() => {
    if (status.kind === "success") headingRef.current?.focus();
  }, [status.kind]);

  // ── Google Places: se carga recién al primer foco del campo de zona ─────

  function ensurePlaces() {
    if (placesRequestedRef.current) return;
    placesRequestedRef.current = true;
    loadGooglePlaces().then((ready) => {
      const input = zonaRef.current;
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
      placesListenerRef.current = autocomplete.addListener("place_changed", () => {
        const selection = placeSelection(autocomplete.getPlace());
        if (!selection) return;
        setValues((current) => ({ ...current, zona: selection.value }));
        setGeo(selection.geo);
      });
    });
  }

  // `.pac-container` cuelga de <body> y Google no lo limpia solo. Y ningún
  // lookup de patente sigue vivo (ni su polling) con el form desmontado.
  useEffect(
    () => () => {
      placesListenerRef.current?.remove();
      document.querySelectorAll(".pac-container").forEach((el) => el.remove());
      plateLookupRef.current?.controller.abort();
    },
    [],
  );

  // ── Patente: lookup en clasific.ar ─────────────────────────────────────

  /**
   * Arranca (una vez por patente) el lookup de `plate`, ya válida. Si había
   * otro en curso por una patente distinta, lo cancela: su resultado nunca
   * llega al estado. Devuelve la promesa, para que el envío pueda esperarla.
   */
  function startPlateLookup(plate: string): Promise<VehicleLookupOutcome> {
    const current = plateLookupRef.current;
    if (current?.plate === plate) return current.promise;
    current?.controller.abort();

    const controller = new AbortController();
    const lookup: PlateLookup = {
      plate,
      controller,
      outcome: null,
      promise: lookupVehicleFromBrowser(plate, { signal: controller.signal }).then(
        (outcome) => {
          lookup.outcome = outcome;
          if (outcome.kind !== "aborted" && plateLookupRef.current === lookup) {
            setPlateCheck({
              kind: outcome.kind === "found" ? "valid" : "unverified",
              plate,
            });
          }
          return outcome;
        },
      ),
    };
    plateLookupRef.current = lookup;
    setPlateCheck({ kind: "validating", plate });
    return lookup.promise;
  }

  // El lookup arranca al salir del campo (o al enviar). Editar la patente
  // después cancela lo que hubiera en curso y vuelve el estado a cero.
  const plate = values.patente;
  useEffect(() => {
    const current = plateLookupRef.current;
    if (!current || current.plate === plate) return;
    current.controller.abort();
    plateLookupRef.current = null;
    setPlateCheck({ kind: "idle" });
  }, [plate]);

  /**
   * Lo que viaja como `vehicleLookup`: el snapshot del auto encontrado para
   * ESTA patente. Si el lookup sigue en curso lo espera, con tope; si no
   * terminó a tiempo, falló o no lo encontró, el pedido sale sin él.
   */
  async function snapshotForSubmit(plateValue: string): Promise<VehicleLookupSnapshot | undefined> {
    if (!isValidPlate(plateValue)) return undefined;
    const outcome = await withTimeout(startPlateLookup(plateValue), SUBMIT_LOOKUP_WAIT_MS);
    if (outcome?.kind !== "found" || !outcome.snapshot) return undefined;
    return outcome.snapshot.queriedPlate === plateValue ? outcome.snapshot : undefined;
  }

  // ── Campos ─────────────────────────────────────────────────────────────

  function setField(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  /**
   * Atajo de "¿Qué le pasa al auto?": suma el texto al campo, separado por
   * coma, o lo saca si ya estaba. El campo sigue siendo texto libre: la
   * persona puede completar o corregir lo que armaron los atajos.
   */
  function toggleQuickPick(term: string) {
    // Tocar un atajo también es empezar el pedido (el foco en un botón no
    // lo cuenta `trackQuoteStart`).
    if (!quoteStartTrackedRef.current) {
      quoteStartTrackedRef.current = true;
      trackMetaCustomEvent(META_CUSTOM_EVENTS.quoteStart);
    }
    setValues((current) => {
      const parts = current.problema
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      const at = parts.findIndex((part) => part.toLowerCase() === term.toLowerCase());
      const next = at === -1 ? [...parts, term] : parts.filter((_, index) => index !== at);
      return { ...current, problema: next.join(", ") };
    });
  }

  function handleBlur(name: FieldName) {
    if (VALIDATE_ON_BLUR.includes(name)) {
      setTouched((current) => (current[name] ? current : { ...current, [name]: true }));
    }
    if (name === "patente" && isValidPlate(values.patente)) {
      // Salió del campo con una patente válida: se valida en clasific.ar.
      startPlateLookup(values.patente);
    }
  }

  /** `QuoteStart`: primer foco en cualquier campo, una vez por visita. */
  function trackQuoteStart(event: React.FocusEvent<HTMLFormElement>) {
    const isField =
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement;
    if (!isField || quoteStartTrackedRef.current) return;
    quoteStartTrackedRef.current = true;
    trackMetaCustomEvent(META_CUSTOM_EVENTS.quoteStart);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "submitting") return;

    setAttempted(true);
    const firstInvalid = FIELD_ORDER.find((name) => allErrors[name]);
    if (firstInvalid) {
      fieldRefs[firstInvalid].current?.focus();
      return;
    }

    setStatus({ kind: "submitting" });
    // Mismo ID para el `Lead` del Pixel y el de la Conversions API (lo manda
    // la route): Meta cuenta un solo lead aunque le lleguen los dos.
    const metaEventId = createMetaEventId();
    const zona = values.zona.trim();
    const plateValue = values.patente;
    // Con patente, espera (con tope) al lookup en curso. Nunca bloquea.
    const vehicleLookup = await snapshotForSubmit(plateValue);

    let response: Response;
    let data: { error?: unknown; publicCode?: unknown } | null;
    try {
      response = await fetch("/api/presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Opcional: sin patente no viaja, ni ella ni el `vehicleLookup`
          // (el backend da 400 si llega un snapshot sin patente).
          ...(plateValue ? { plate: plateValue } : {}),
          ...(plateValue && vehicleLookup ? { vehicleLookup } : {}),
          description: values.problema.trim(),
          // Tal cual: la route lo valida y normaliza con la misma regla.
          contactPhone: values.whatsapp.trim(),
          address: zona,
          // Solo si vinieron de una sugerencia elegida: `geo` se resetea en
          // cuanto la persona edita el texto a mano.
          latitude: geo.latitude,
          longitude: geo.longitude,
          locality: geo.locality,
          province: geo.province,
          // Sin checkbox: pedir es aceptar (lo dice el texto legal debajo
          // del botón, con el link a /privacidad).
          consent: true,
          // Lo consume la route para la Conversions API; al backend no llega.
          metaEventId,
        }),
      });
      data = await response.json().catch(() => null);
    } catch {
      setStatus({ kind: "error", message: copy.genericError });
      return;
    }

    if (!response.ok) {
      setStatus({
        kind: "error",
        message:
          typeof data?.error === "string" && data.error ? data.error : copy.genericError,
      });
      return;
    }

    // El pedido ya entró: si el lookup seguía con su polling, no hace falta.
    plateLookupRef.current?.controller.abort();
    // `lead_source` separa este `Lead` del de los botones de WhatsApp: los
    // dos son la conversión de la campaña (ver `META_LEAD_SOURCES`).
    trackMetaEvent(
      META_EVENTS.lead,
      { lead_source: META_LEAD_SOURCES.form },
      metaEventId,
    );
    setStatus({
      kind: "success",
      publicCode:
        typeof data?.publicCode === "string" && data.publicCode.trim()
          ? data.publicCode.trim().replace(/^#+/, "")
          : null,
      zona,
      plate: plateValue,
    });
  }

  const describedBy = (name: FieldName, ...extra: (string | false | undefined)[]) =>
    [...extra, errors[name] ? `${FIELD_IDS[name]}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const submitting = status.kind === "submitting";
  const plateStatusId = `${FIELD_IDS.patente}-status`;
  // El estado del lookup reemplaza a la ayuda de la patente mientras existe.
  const plateCheckNow =
    plateCheck.kind !== "idle" && plateCheck.plate === values.patente ? plateCheck : null;
  const showPlateHint = plateCheckNow === null;
  // Ícono dentro de la patente: el error de formato gana; si no, el lookup.
  const plateStatus: FieldStatus = errors.patente
    ? "invalid"
    : plateCheckNow?.kind === "validating"
      ? "validating"
      : plateCheckNow?.kind === "valid"
        ? "valid"
        : plateCheckNow?.kind === "unverified"
          ? "notice"
          : "idle";
  // Ícono dentro del WhatsApp: recién después del primer blur (o envío), y
  // desde ahí en vivo. Sin estado "validando": la validación es sincrónica.
  // (`errors` ya viene filtrado por blur / intento de envío.)
  const whatsappStatus: FieldStatus = errors.whatsapp
    ? "invalid"
    : touched.whatsapp || attempted
      ? "valid"
      : "idle";

  return (
    <section
      id={PEDIDO_IDS.form}
      ref={rootRef}
      aria-labelledby={PEDIDO_IDS.formTitle}
      role={open ? "dialog" : undefined}
      aria-modal={open ? true : undefined}
      className={cn(
        open
          ? // `z-60`: arriba del header sticky del sitio (`z-50`) y del
            // panel del menú mobile (`z-40`). Es una vista de pantalla completa.
            "fixed inset-0 z-60 flex flex-col overflow-y-auto overscroll-contain bg-surface"
          : "hidden rounded-card border border-line bg-surface p-8 lg:block",
      )}
    >
      {open ? (
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-1 border-b border-line bg-surface px-2">
          <button
            type="button"
            onClick={requestClose}
            aria-label={copy.back}
            className="flex size-11 items-center justify-center rounded-field text-ink transition-colors hover:bg-surface-muted"
          >
            <Icon name="arrow-left" size={22} strokeWidth={2} />
          </button>
          <Image
            src="/brand/lockup-light.png"
            alt={header.logoAlt}
            width={676}
            height={132}
            sizes="103px"
            className="h-5 w-auto"
          />
        </div>
      ) : null}

      <div className={cn(open && "flex flex-1 flex-col px-6 pt-8")}>
        {status.kind === "success" ? (
          <Confirmation
            headingRef={headingRef}
            publicCode={status.publicCode}
            zona={status.zona}
            plate={status.plate}
          />
        ) : (
          <>
            <h2
              id={PEDIDO_IDS.formTitle}
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-2xl font-bold text-ink outline-none"
            >
              {copy.title}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-ink/70">{copy.subtitle}</p>

            <form
              noValidate
              onSubmit={handleSubmit}
              onFocusCapture={trackQuoteStart}
              className={cn("mt-7 flex flex-col", open && "flex-1")}
            >
              <div className="flex flex-col gap-4">
                <Field
                  label={copy.fields.problema.label}
                  htmlFor={FIELD_IDS.problema}
                  error={errors.problema}
                  errorId={`${FIELD_IDS.problema}-error`}
                >
                  <QuickPicks
                    id={`${FIELD_IDS.problema}-atajos`}
                    value={values.problema}
                    onToggle={toggleQuickPick}
                  />
                  <Textarea
                    id={FIELD_IDS.problema}
                    ref={problemaRef}
                    required
                    rows={3}
                    value={values.problema}
                    onChange={(event) => setField("problema", event.target.value)}
                    placeholder={copy.fields.problema.placeholder}
                    aria-invalid={errors.problema ? true : undefined}
                    aria-describedby={describedBy("problema")}
                    className={cn(controlClass, "resize-none")}
                  />
                </Field>

                <Field
                  label={copy.fields.zona.label}
                  htmlFor={FIELD_IDS.zona}
                  error={errors.zona}
                  errorId={`${FIELD_IDS.zona}-error`}
                >
                  <Input
                    id={FIELD_IDS.zona}
                    ref={zonaRef}
                    type="text"
                    required
                    value={values.zona}
                    onChange={(event) => {
                      setField("zona", event.target.value);
                      // Editar a mano invalida el geocode de la sugerencia.
                      setGeo(EMPTY_GEO);
                    }}
                    onFocus={ensurePlaces}
                    onPointerDown={ensurePlaces}
                    onKeyDown={(event) => {
                      // Enter elige la sugerencia de Places: no manda el form.
                      if (event.key === "Enter" && placesDropdownOpen()) {
                        event.preventDefault();
                      }
                    }}
                    placeholder={copy.fields.zona.placeholder}
                    autoComplete="off"
                    aria-invalid={errors.zona ? true : undefined}
                    aria-describedby={describedBy("zona")}
                    className={controlClass}
                  />
                </Field>

                {/* Patente y WhatsApp en dos columnas solo en la vista a
                    pantalla completa de tablet (`sm`), donde sobra ancho. En
                    la tarjeta de desktop (`lg`, 420-600px) las columnas
                    partían las ayudas en dos líneas, cada una distinta según
                    el ancho, y la fila se leía despareja: ahí van apiladas,
                    cada ayuda en una línea. La tarjeta sigue más baja que la
                    columna de texto del hero, así que el hero no crece. */}
                <div className="grid gap-4 sm:grid-cols-2 sm:items-start lg:grid-cols-1">
                  <Field
                    label={
                      <>
                        {copy.fields.patente.label}
                        <span className="font-normal"> {copy.optional}</span>
                      </>
                    }
                    htmlFor={FIELD_IDS.patente}
                    hint={showPlateHint ? copy.fields.patente.hint : undefined}
                    hintId={`${FIELD_IDS.patente}-hint`}
                    error={errors.patente}
                    errorId={`${FIELD_IDS.patente}-error`}
                  >
                    <div className="relative">
                    <Input
                      id={FIELD_IDS.patente}
                      ref={patenteRef}
                      type="text"
                      value={values.patente}
                      onChange={(event) =>
                        setField("patente", normalizePlateInput(event.target.value))
                      }
                      onBlur={() => handleBlur("patente")}
                      placeholder={copy.fields.patente.placeholder}
                      maxLength={9}
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      aria-invalid={errors.patente ? true : undefined}
                      aria-busy={plateStatus === "validating" || undefined}
                      aria-describedby={describedBy(
                        "patente",
                        showPlateHint && `${FIELD_IDS.patente}-hint`,
                        plateStatusId,
                      )}
                      className={cn(
                        controlClass,
                        FIELD_STATUS_PADDING,
                        "tracking-wide uppercase placeholder:normal-case",
                      )}
                    />
                    <FieldStatusIcon status={plateStatus} />
                    </div>
                    <PlateStatus id={plateStatusId} check={plateCheck} plate={values.patente} />
                  </Field>

                  <Field
                    label={copy.fields.whatsapp.label}
                    htmlFor={FIELD_IDS.whatsapp}
                    hint={copy.fields.whatsapp.hint}
                    hintId={`${FIELD_IDS.whatsapp}-hint`}
                    error={errors.whatsapp}
                    errorId={`${FIELD_IDS.whatsapp}-error`}
                  >
                    {/* Un solo control visual: el `+54` es parte del campo. Borde,
                        fondo, radio y foco son los de `Input` (form-controls). */}
                    <div
                      className={cn(
                        "flex overflow-clip rounded-field border bg-surface-subtle transition-colors focus-within:border-brand",
                        errors.whatsapp ? "border-danger" : "border-line",
                      )}
                    >
                      <span
                        id={`${FIELD_IDS.whatsapp}-prefix`}
                        className="flex shrink-0 items-center border-r border-line bg-surface-muted px-3.5 text-[0.9375rem] text-ink/70"
                      >
                        <span aria-hidden="true">{copy.fields.whatsapp.prefix}</span>
                        <span className="sr-only">{copy.fields.whatsapp.prefixLabel}</span>
                      </span>
                      <div className="relative min-w-0 flex-1">
                      {/* Formato mientras se escribe (`11 2345-6789`): ver
                          `formatArWhatsappInput` en lib/phone.ts. */}
                      <WhatsappInput
                        id={FIELD_IDS.whatsapp}
                        ref={whatsappRef}
                        autoComplete="tel-national"
                        required
                        value={values.whatsapp}
                        onValueChange={(value) => setField("whatsapp", value)}
                        onBlur={() => handleBlur("whatsapp")}
                        placeholder={copy.fields.whatsapp.placeholder}
                        aria-invalid={errors.whatsapp ? true : undefined}
                        aria-describedby={describedBy(
                          "whatsapp",
                          `${FIELD_IDS.whatsapp}-prefix`,
                          `${FIELD_IDS.whatsapp}-hint`,
                        )}
                        className={cn(controlClass, FIELD_STATUS_PADDING, "rounded-none border-0")}
                      />
                      <FieldStatusIcon status={whatsappStatus} />
                      </div>
                    </div>
                  </Field>
                </div>
              </div>

              <div
                className={cn(
                  "mt-7 flex flex-col gap-3",
                  // En la vista mobile el botón queda pegado abajo, como en
                  // una pantalla de app. `calc` con `env()`: no hay utility
                  // canónica para sumar el área segura del iPhone.
                  open &&
                    "sticky bottom-0 -mx-6 mt-auto border-t border-line bg-surface px-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
                )}
              >
                {status.kind === "error" ? <FormError message={status.message} /> : null}
                <button
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting || undefined}
                  className={buttonVariants({
                    variant: "primary",
                    size: "lg",
                    block: true,
                  })}
                >
                  {submitting ? copy.submitting : copy.submit}
                </button>
                <p className="flex items-center justify-center gap-2 text-sm font-medium text-ink/80">
                  <Icon name="check" size={16} strokeWidth={2.4} className="shrink-0 text-brand" />
                  {copy.free}
                </p>
                <p className="text-center text-xs leading-relaxed text-ink/65">
                  {copy.legal}{" "}
                  <Link href="/privacidad" className={inlineLink}>
                    {copy.privacyLink}
                  </Link>
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

/**
 * Sobre `Input`/`Textarea` de form-controls (los del resto del sitio): borde
 * rojo con error, y el placeholder un escalón más oscuro que el default
 * (`ink/40` da 2.5:1; `ink/65` pasa 4.5:1 sobre `surface-subtle`).
 */
const controlClass = "placeholder:text-ink/65 aria-[invalid=true]:border-danger";

/** Link dentro de un texto: el de la home (`HeroSection`). */
const inlineLink =
  "font-semibold text-brand-hover underline decoration-brand-hover/40 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink";

/**
 * Atajos de "¿Qué le pasa al auto?". Botones toggle (`aria-pressed`), no
 * checkboxes: no son un campo propio, escriben en el textarea, que es lo que
 * se envía. Un atajo está "puesto" si su texto está en el campo, así que
 * borrarlo a mano también lo apaga. Chips: la anatomía de DESIGN.md (pill,
 * borde `line` sobre `surface-subtle`; puesto, borde `brand` sobre su lavado).
 */
function QuickPicks({
  id,
  value,
  onToggle,
}: {
  readonly id: string;
  readonly value: string;
  readonly onToggle: (term: string) => void;
}) {
  const { label, items } = copy.fields.problema.quickPicks;
  const current = value
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  return (
    <div role="group" aria-labelledby={`${id}-label`} className="flex flex-col gap-2">
      <p id={`${id}-label`} className="sr-only">
        {label}
      </p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => {
          const pressed = current.includes(item.toLowerCase());
          return (
            <li key={item}>
              <button
                type="button"
                aria-pressed={pressed}
                onClick={() => onToggle(item)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm text-ink transition-colors lg:min-h-9",
                  pressed
                    ? "border-brand bg-brand/8"
                    : "border-line bg-surface-subtle hover:border-brand/40",
                )}
              >
                {pressed ? (
                  <Icon name="check" size={14} strokeWidth={2.6} className="-ml-0.5 text-brand-hover" />
                ) : null}
                {item}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Texto del lookup debajo de la patente. La región `aria-live` existe siempre
 * (vacía en reposo): si se montara junto con el texto, el lector de pantalla
 * no anunciaría el cambio. "Validando…" y "Patente validada" solo se leen
 * (el ícono dentro del campo ya lo muestra); "No pudimos validarla…" también
 * se ve, porque dice algo que el ícono solo no dice: que se puede enviar igual.
 */
function PlateStatus({
  id,
  check,
  plate,
}: {
  readonly id: string;
  readonly check: PlateCheck;
  readonly plate: string;
}) {
  const current = check.kind !== "idle" && check.plate === plate ? check : null;
  const text = copy.fields.patente.status;
  return (
    <p
      id={id}
      aria-live="polite"
      className={cn(current?.kind === "unverified" ? "text-xs text-ink/65" : "sr-only")}
    >
      {current?.kind === "validating" ? text.validating : null}
      {current?.kind === "valid" ? text.valid : null}
      {current?.kind === "unverified" ? text.unverified : null}
    </p>
  );
}

/**
 * Confirmación: reemplaza al form. Anatomía de `FormSuccess` (el check en su
 * círculo, título display, bajada) con el `h2` enfocable de esta página.
 */
function Confirmation({
  headingRef,
  publicCode,
  zona,
  plate,
}: {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly publicCode: string | null;
  readonly zona: string;
  readonly plate: string;
}) {
  const href = whatsappUrl(
    publicCode
      ? done.whatsappTextWithCode.replace("{code}", publicCode)
      : done.whatsappText,
  );

  return (
    <div className="flex flex-col pb-8 lg:pb-0">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Icon name="check" size={24} />
        </span>
        <h2
          id={PEDIDO_IDS.formTitle}
          ref={headingRef}
          tabIndex={-1}
          className="mt-5 font-display text-2xl font-bold text-ink outline-none"
        >
          {done.title}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-ink/70">{done.body}</p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <WhatsappLink
          placement="confirmation"
          afterOrder
          href={href}
          label={done.whatsappLabel}
          block
        />
        <p className="text-center text-label text-ink/65">{done.fallback}</p>
      </div>

      <div className="mt-8 rounded-card border border-line bg-surface-subtle px-5 py-4">
        <p className="text-label text-ink/65">{done.orderLabel}</p>
        {publicCode ? (
          <p className="mt-1 font-display text-xl font-semibold text-ink tabular-nums">
            {done.orderCode.replace("{code}", publicCode)}
          </p>
        ) : null}
        <p className="mt-1 text-sm text-ink/70">
          {zona} · {plate || done.noPlate}
        </p>
      </div>
    </div>
  );
}
