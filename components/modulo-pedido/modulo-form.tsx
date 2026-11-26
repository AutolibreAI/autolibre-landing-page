"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  placesDropdownOpen,
  postQuoteRequest,
  usePlacesAutocomplete,
  usePlateLookup,
} from "@/components/pedido/pedido-client";
// Estilos del dropdown de Google Places: CSS global porque Google cuelga el
// listbox de <body>, fuera del árbol de React.
import "@/components/quote-flow/places-autocomplete.css";
import {
  ANALYTICS_EVENTS,
  DOWNLOAD_SECTIONS,
  LEAD_SOURCES,
  QUOTE_FLOWS,
  QUOTE_TABS,
  type QuoteChip,
  type QuoteModulePlacement,
} from "@/lib/analytics/events";
import { createMetaEventId } from "@/lib/analytics/meta-pixel";
import { getPostHogIds } from "@/lib/analytics/posthog";
import { track } from "@/lib/analytics/track";
import type { moduloPedidoContent } from "@/lib/content/modulo-pedido";
import type { RequestFlowContent } from "@/lib/content/request-flow";
import { whatsappErrorMessage } from "@/lib/content/whatsapp-errors";
import { EMPTY_GEO, type PlaceGeo } from "@/lib/google-places";
import { takePedidoPrefill } from "@/lib/pedido-prefill";
import { parseArWhatsapp } from "@/lib/phone";
import { isValidPlate } from "@/lib/plate";
import type { QuoteDetails } from "@/lib/quote-details";
import { cn } from "@/lib/utils";
import {
  RequestFlowOverlay,
  type ContactField,
  type RequestFlowCloseReason,
  type RequestFlowSubmitResult,
} from "./request-flow-overlay";
import { useRotatingPlaceholder } from "./use-rotating-placeholder";

type TallerContent = (typeof moduloPedidoContent)["taller"];

/** Copy que necesita la isla. Llega por props desde el server: no se empaqueta en el JS. */
export type ModuloFormCopy = {
  readonly problema: TallerContent["problema"];
  readonly zona: TallerContent["zona"];
  readonly next: string;
  readonly chipsLabel: string;
  readonly contact: TallerContent["contact"];
  readonly sent: TallerContent["sent"];
  /** Paso final (`RequestFlowOverlay`). */
  readonly requestFlow: RequestFlowContent;
};

export type ModuloChip = {
  readonly id: QuoteChip;
  readonly label: string;
  /** `next/image` decorativo, renderizado en el server. */
  readonly icon: React.ReactNode;
};

type ModuloFormProps = {
  readonly idPrefix: string;
  readonly placement: QuoteModulePlacement;
  readonly copy: ModuloFormCopy;
  readonly chips: readonly ModuloChip[];
  /** "¿Preferís chatear?" + WhatsApp (server, medido por `data-analytics-*`). */
  readonly whatsapp: React.ReactNode;
  /** Links a `/terminos` y `/privacidad` del consentimiento (server). */
  readonly consentLinks: { readonly terms: React.ReactNode; readonly privacy: React.ReactNode };
  /** Ícono de la confirmación (server). */
  readonly sentIcon: React.ReactNode;
  /**
   * Bloque de la app de la confirmación (`ModuloAppPromo`, server): capturas,
   * QR y tiendas. Se monta recién al enviar; hasta ahí sus imágenes no se
   * piden.
   */
  readonly appPromo: React.ReactNode;
  /** Valor de `APP_VINCULADA` (viaja como `app_linked` en `pedido_app_promo_view`). */
  readonly appLinked: boolean;
};

type FieldName = "problema" | "zona" | "whatsapp" | "patente";
type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName | "consent", string>>;

const EMPTY_VALUES: Values = { problema: "", zona: "", whatsapp: "", patente: "" };
const BAR_FIELDS = ["problema", "zona"] as const;
const CONTACT_FIELDS = ["whatsapp", "patente"] as const;

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

/**
 * Pestaña Taller del módulo de pedido (Home y `/pedido`): el único camino del
 * módulo que registra un pedido en el backend (`/api/presupuesto`).
 *
 * 1. En la página: "¿Qué le pasa?" (placeholder con ejemplos que rotan) +
 *    "¿Dónde estás?" + "Pedir propuestas"; debajo, la salida por WhatsApp y
 *    los chips de "Lo más pedido".
 * 2. "Pedir propuestas" (con los dos campos completos) abre
 *    `RequestFlowOverlay`: la página se limpia, la barra sube y suma para
 *    cuándo, repuestos, kilometraje, patente, WhatsApp y consentimiento
 *    (checkbox desmarcado y obligatorio, decisión de producto del
 *    2026-11-24). El envío y la confirmación pasan ahí adentro; "Volver al
 *    inicio" deja el módulo vacío otra vez (`reset`).
 *
 * El estado (valores, validación, lookup de la patente, envío y medición)
 * vive acá; la capa solo pinta y anima. Reglas de `pedido-client.ts`: misma
 * validación del WhatsApp (`parseArWhatsapp`) y de la patente
 * (`isValidPlate`), lookup de la patente en clasific.ar al salir del campo
 * (nunca bloquea el envío), Google Places recién al enfocar "¿Dónde estás?".
 */
export function ModuloForm({
  idPrefix,
  placement,
  copy,
  chips,
  whatsapp,
  consentLinks,
  sentIcon,
  appPromo,
  appLinked,
}: ModuloFormProps) {
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [geo, setGeo] = useState<PlaceGeo>(EMPTY_GEO);
  const [attempted, setAttempted] = useState({ bar: false, contact: false });
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [publicCode, setPublicCode] = useState<string | null>(null);
  // Consentimiento real: arranca desmarcado y viaja con su valor.
  const [consent, setConsent] = useState(false);
  // "¿Qué le pasa?": el placeholder rota por los ejemplos hasta que la
  // persona enfoca el campo o escribe.
  const [problemaFocused, setProblemaFocused] = useState(false);
  const problemaPlaceholder = useRotatingPlaceholder(
    copy.problema.placeholders,
    problemaFocused || values.problema !== "",
  );
  // Pantalla limpia: `overlayFrom` es la foto de la barra al tocar "Pedir
  // propuestas" (el "First" del FLIP); `null` = cerrada.
  const [overlayFrom, setOverlayFrom] = useState<DOMRect | null>(null);
  // La confirmación ya se ve adentro de la capa (mide el bloque de la app).
  const [sentShown, setSentShown] = useState(false);

  const problemaRef = useRef<HTMLInputElement>(null);
  const zonaRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const sentRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const step2TrackedRef = useRef(false);
  // A dónde vuelve el foco al cerrar la capa.
  const focusAfterOverlayRef = useRef<"next" | "problema" | null>(null);

  const ids = {
    problema: `${idPrefix}-que`,
    zona: `${idPrefix}-zona`,
    chips: `${idPrefix}-chips`,
  };
  const barRefs = { problema: problemaRef, zona: zonaRef };

  const ensurePlaces = usePlacesAutocomplete(zonaRef, (selection) => {
    setValues((current) => ({ ...current, zona: selection.value }));
    setGeo(selection.geo);
  });
  const { plateCheck, startPlateLookup, snapshotForSubmit, abortPlateLookup } =
    usePlateLookup(values.patente);

  // Estable: la capa lo usa en su listener de resize.
  const getBarRect = useCallback(() => barRef.current?.getBoundingClientRect() ?? null, []);

  // Lo que la persona escribió en la banda del directorio o en el perfil de
  // un proveedor (`lib/pedido-prefill.ts`). Solo completa el campo: no mueve
  // el foco ni cuenta como `quote_started` (eso es la primera interacción
  // acá). Mismo alto antes y después: no hay CLS.
  useEffect(() => {
    const prefill = takePedidoPrefill();
    // Sincroniza con un sistema externo (`sessionStorage`) una sola vez,
    // DESPUÉS de hidratar: leerlo en el estado inicial haría que el HTML del
    // server y el primer render del cliente no coincidan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (prefill) setValues((current) => (current.problema ? current : { ...current, problema: prefill }));
  }, []);

  // Foco al cerrar la capa. En un efecto: recién acá la capa ya sacó el
  // `inert` de la página.
  useEffect(() => {
    if (overlayFrom) return;
    const target = focusAfterOverlayRef.current;
    focusAfterOverlayRef.current = null;
    if (target === "next") nextButtonRef.current?.focus({ preventScroll: true });
    if (target === "problema") problemaRef.current?.focus({ preventScroll: true });
  }, [overlayFrom]);

  // Confirmación: `pedido_app_promo_view` al aparecer el bloque de la app y
  // `qr_view` cuando el QR entra en pantalla (solo existe desde `lg`: con
  // `display: none` el observer nunca lo ve, así que en celular no sale).
  // Una vez por envío: "Volver al inicio" desmonta el bloque.
  useEffect(() => {
    if (!sentShown) return;
    track(ANALYTICS_EVENTS.pedidoAppPromoView, { placement, app_linked: appLinked });
    const qr = sentRef.current?.querySelector("[data-qr-view]");
    if (!qr || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        track(ANALYTICS_EVENTS.qrView, { section: DOWNLOAD_SECTIONS.pedidoEnviado, placement });
      },
      { threshold: 0.5 },
    );
    observer.observe(qr);
    return () => observer.disconnect();
  }, [sentShown, placement, appLinked]);

  // ── Validación ─────────────────────────────────────────────────────────

  const allErrors: Errors = {};
  if (!values.problema.trim()) allErrors.problema = copy.problema.error;
  if (!values.zona.trim()) allErrors.zona = copy.zona.error;
  const phone = parseArWhatsapp(values.whatsapp);
  if (!phone.ok) allErrors.whatsapp = whatsappErrorMessage(phone.error, phone.diff);
  if (values.patente && !isValidPlate(values.patente)) {
    allErrors.patente = copy.contact.patente.error;
  }
  if (!consent) allErrors.consent = copy.contact.consent.error;
  // Un error se ve después del primer intento de su parte o, en WhatsApp y
  // patente, después de salir del campo. Desde ahí se corrige en vivo.
  const errors: Errors = {};
  for (const name of BAR_FIELDS) {
    if (allErrors[name] && attempted.bar) errors[name] = allErrors[name];
  }
  for (const name of CONTACT_FIELDS) {
    if (allErrors[name] && (attempted.contact || touched[name])) errors[name] = allErrors[name];
  }
  // El del consentimiento, solo después de intentar enviar.
  if (allErrors.consent && attempted.contact) errors.consent = allErrors.consent;

  // ── Medición ───────────────────────────────────────────────────────────

  const moduleProps = { tab: QUOTE_TABS.taller, placement } as const;

  /** `quote_started` (Meta: `QuoteStart`): primera interacción, una vez por montaje. */
  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    track(ANALYTICS_EVENTS.quoteStarted, { flow: QUOTE_FLOWS.page, ...moduleProps });
  }

  function onFocusCapture(event: React.FocusEvent<HTMLFormElement>) {
    if (event.target instanceof HTMLInputElement) markStarted();
  }

  // ── Acciones ───────────────────────────────────────────────────────────

  function setField(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function chipPressed(chip: ModuloChip) {
    return values.problema.trim().toLowerCase() === chip.label.toLowerCase();
  }

  /** Un chip completa "¿Qué le pasa?" con su texto; tocarlo puesto lo saca. */
  function toggleChip(chip: ModuloChip) {
    markStarted();
    const selected = !chipPressed(chip);
    setField("problema", selected ? chip.label : "");
    track(ANALYTICS_EVENTS.quoteChipClicked, { chip: chip.id, placement, selected });
  }

  /** "Pedir propuestas": valida la barra y abre la pantalla limpia. */
  function openRequestFlow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted((current) => ({ ...current, bar: true }));
    const firstInvalid = BAR_FIELDS.find((name) => allErrors[name]);
    if (firstInvalid) {
      barRefs[firstInvalid].current?.focus();
      return;
    }
    const barRect = barRef.current?.getBoundingClientRect();
    if (!barRect) return;
    markStarted();
    // Sigue siendo el paso 2 del embudo (`quote_step_viewed`), una vez por montaje.
    if (!step2TrackedRef.current) {
      step2TrackedRef.current = true;
      track(ANALYTICS_EVENTS.quoteStepViewed, { flow: QUOTE_FLOWS.page, step: 2, ...moduleProps });
    }
    setStatus({ kind: "idle" });
    setOverlayFrom(barRect);
  }

  function handleBlur(name: "whatsapp" | "patente") {
    setTouched((current) => (current[name] ? current : { ...current, [name]: true }));
    // Salió de la patente con una válida: se valida en clasific.ar.
    if (name === "patente" && isValidPlate(values.patente)) startPlateLookup(values.patente);
  }

  /** Valida el contacto y, si está todo bien, envía con los detalles. */
  async function submitRequest(details: QuoteDetails): Promise<RequestFlowSubmitResult> {
    if (status.kind === "submitting") return { ok: false };
    setAttempted((current) => ({ ...current, contact: true }));
    const invalid: ContactField | undefined =
      CONTACT_FIELDS.find((name) => allErrors[name]) ?? (consent ? undefined : "consent");
    if (invalid) return { ok: false, invalid };
    return { ok: await sendQuote(details) };
  }

  /** Vuelve todo a cero: la barra vacía, como recién llegada la página. */
  function reset() {
    setValues(EMPTY_VALUES);
    setGeo(EMPTY_GEO);
    setAttempted({ bar: false, contact: false });
    setTouched({});
    setPublicCode(null);
    setConsent(false);
    setStatus({ kind: "idle" });
  }

  function onOverlayClosed(reason: RequestFlowCloseReason) {
    if (reason === "done") {
      // Después de enviar: módulo vacío para otro pedido, foco a "¿Qué le pasa?".
      reset();
      setSentShown(false);
    }
    focusAfterOverlayRef.current = reason === "close" ? "next" : "problema";
    setOverlayFrom(null);
  }

  /**
   * Manda el pedido a `/api/presupuesto` con los detalles y mide el
   * resultado. `true` si quedó registrado.
   */
  async function sendQuote(details: QuoteDetails): Promise<boolean> {
    setStatus({ kind: "submitting" });
    // Mismo ID para el `Lead` del Pixel y el de la Conversions API.
    const metaEventId = createMetaEventId();
    const plateValue = values.patente;
    // Con patente, espera (con tope) al lookup en curso. Nunca bloquea.
    const vehicleLookup = await snapshotForSubmit(plateValue);
    const posthogIds = getPostHogIds();

    const result = await postQuoteRequest({
      // Opcional: sin patente no viaja, ni ella ni el `vehicleLookup`.
      ...(plateValue ? { plate: plateValue } : {}),
      ...(plateValue && vehicleLookup ? { vehicleLookup } : {}),
      description: values.problema.trim(),
      contactPhone: values.whatsapp.trim(),
      address: values.zona.trim(),
      // Solo si vinieron de una sugerencia elegida de Google Places.
      latitude: geo.latitude,
      longitude: geo.longitude,
      locality: geo.locality,
      province: geo.province,
      // El valor real del checkbox (acá siempre `true`: sin él no se llega).
      consent,
      // Para cuándo, repuestos y km. La route solo los pasa al backend con
      // `QUOTE_DETAILS_ENABLED`.
      ...details,
      metaEventId,
      // Solo para PostHog (los consume la route; al backend no llegan).
      quoteFlow: QUOTE_FLOWS.page,
      quoteTab: QUOTE_TABS.taller,
      quotePlacement: placement,
      posthogDistinctId: posthogIds?.distinctId,
      posthogSessionId: posthogIds?.sessionId,
    });

    if (!result.ok) {
      track(ANALYTICS_EVENTS.quoteFailed, {
        flow: QUOTE_FLOWS.page,
        ...moduleProps,
        ...(result.reason === "server"
          ? { reason: "server", status: result.status }
          : { reason: "network" }),
      });
      setStatus({
        kind: "error",
        message: (result.reason === "server" && result.message) || copy.contact.genericError,
      });
      return false;
    }

    abortPlateLookup();
    // `Lead` de Meta con el `eventID` de la Conversions API. En PostHog
    // `quote_submitted` lo manda la route (con `tab` y `placement`).
    track(
      ANALYTICS_EVENTS.quoteSubmitted,
      // `lead_source: "form"` en las dos ubicaciones: es lo mismo que pone la
      // route en el `quote_submitted` de PostHog para todo `flow: "page"`.
      { flow: QUOTE_FLOWS.page, lead_source: LEAD_SOURCES.form, ...moduleProps },
      { metaEventId },
    );
    setPublicCode(result.publicCode);
    setStatus({ kind: "idle" });
    return true;
  }

  const describedBy = (name: (typeof BAR_FIELDS)[number]) =>
    errors[name] ? `${ids[name]}-error` : undefined;

  const barErrors = BAR_FIELDS.filter((name) => errors[name]);
  // Celda de un campo dentro de la barra: el anillo de foco va en la celda
  // (el input no tiene borde propio). Anillo hacia adentro: en celular la
  // tarjeta recorta lo que sale de sus bordes redondeados.
  const cell =
    "flex min-w-0 flex-col outline-brand focus-within:outline-2 focus-within:-outline-offset-2 md:rounded-full";
  const barInput =
    "h-8 w-full border-0 bg-transparent p-0 text-base text-fg outline-none placeholder:text-fg-subtle md:h-7";

  return (
    <div className="flex flex-col gap-4.5">
      <form noValidate onSubmit={openRequestFlow} onFocusCapture={onFocusCapture}>
        <div
          ref={barRef}
          className={cn(
            "flex flex-col overflow-hidden rounded-panel border bg-card",
            "md:h-18 md:flex-row md:items-center md:overflow-visible md:rounded-full md:pr-2",
            barErrors.length > 0 ? "border-status-alert" : "border-control-line-strong",
          )}
        >
          <div className={cn(cell, "border-b border-card-line px-4.5 pt-3 pb-2.5 md:min-w-0 md:flex-8 md:self-stretch md:justify-center md:border-b-0 md:py-0 md:pr-4 md:pl-7")}>
            <label htmlFor={ids.problema} className="text-xs font-semibold text-fg">
              {copy.problema.label}
            </label>
            <input
              id={ids.problema}
              ref={problemaRef}
              type="text"
              required
              value={values.problema}
              onChange={(event) => setField("problema", event.target.value)}
              onFocus={() => setProblemaFocused(true)}
              onBlur={() => setProblemaFocused(false)}
              placeholder={problemaPlaceholder.placeholder}
              aria-invalid={errors.problema ? true : undefined}
              aria-describedby={describedBy("problema")}
              className={cn(
                barInput,
                // Fundido entre ejemplos; sin transición con reduced-motion.
                "placeholder:transition-opacity placeholder:duration-200 motion-reduce:placeholder:transition-none",
                problemaPlaceholder.fading && "placeholder:opacity-0",
              )}
            />
          </div>
          <span aria-hidden="true" className="hidden h-9 w-px shrink-0 bg-control-line md:block" />
          <div className={cn(cell, "px-4.5 pt-3 pb-2.5 md:min-w-0 md:flex-5 md:self-stretch md:justify-center md:py-0 md:pr-4 md:pl-6")}>
            <label htmlFor={ids.zona} className="text-xs font-semibold text-fg">
              {copy.zona.label}
            </label>
            <input
              id={ids.zona}
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
                if (event.key === "Enter" && placesDropdownOpen()) event.preventDefault();
              }}
              placeholder={copy.zona.placeholder}
              autoComplete="off"
              aria-invalid={errors.zona ? true : undefined}
              aria-describedby={describedBy("zona")}
              className={barInput}
            />
          </div>
          <Button
            ref={nextButtonRef}
            type="submit"
            variant="primary"
            size="56"
            className="mx-2 mb-2 h-13 shrink-0 rounded-card md:m-0 md:h-14 md:rounded-full"
          >
            {copy.next}
          </Button>
        </div>
        {barErrors.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-1 px-5">
            {barErrors.map((name) => (
              <li key={name} id={`${ids[name]}-error`} className="text-label font-medium text-status-alert">
                {errors[name]}
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      {/* Pantalla limpia: el resto del pedido (portal a <body>). */}
      {overlayFrom ? (
        <RequestFlowOverlay
          from={overlayFrom}
          getOriginRect={getBarRect}
          idPrefix={idPrefix}
          copy={copy.requestFlow}
          contactCopy={copy.contact}
          barLabels={{ problema: copy.problema.label, zona: copy.zona.label }}
          problema={values.problema.trim()}
          zona={values.zona.trim()}
          contact={{
            whatsapp: values.whatsapp,
            onWhatsappChange: (value) => setField("whatsapp", value),
            onWhatsappBlur: () => handleBlur("whatsapp"),
            patente: values.patente,
            onPatenteChange: (value) => setField("patente", value),
            onPatenteBlur: () => handleBlur("patente"),
            plateCheck,
            consent,
            onConsentChange: setConsent,
            errors: { whatsapp: errors.whatsapp, patente: errors.patente, consent: errors.consent },
          }}
          consentLinks={consentLinks}
          submitting={status.kind === "submitting"}
          errorMessage={status.kind === "error" ? status.message : null}
          onSubmit={submitRequest}
          onClosed={onOverlayClosed}
          sentCopy={copy.sent}
          publicCode={publicCode}
          sentIcon={sentIcon}
          appPromo={appPromo}
          successRef={sentRef}
          onSuccessShown={() => setSentShown(true)}
        />
      ) : null}

      {/* WhatsApp ARRIBA de "Lo más pedido" (pedido de producto,
          2026-11-26): form → WhatsApp → chips, en todos los anchos. */}
      {whatsapp}

      <div
        role="group"
        aria-labelledby={ids.chips}
        className="flex flex-col items-center gap-2 md:flex-row md:justify-center"
      >
        <p id={ids.chips} className="shrink-0 text-label font-semibold text-fg-muted md:pr-1">
          {copy.chipsLabel}
        </p>
        <ul className="flex flex-wrap justify-center gap-2">
          {chips.map((chip) => (
            <li key={chip.id}>
              <Chip pressed={chipPressed(chip)} icon={chip.icon} onClick={() => toggleChip(chip)}>
                {chip.label}
              </Chip>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
