"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  FIELD_STATUS_PADDING,
  FieldStatusIcon,
  type FieldStatus,
} from "@/components/ui/field-status-icon";
import { pillInputVariants } from "@/components/ui/pill-input";
import { WhatsappInput } from "@/components/ui/whatsapp-input";
import {
  placesDropdownOpen,
  postQuoteRequest,
  usePlacesAutocomplete,
  usePlateLookup,
  type PlateCheck,
} from "@/components/pedido/pedido-client";
// Estilos del dropdown de Google Places: CSS global porque Google cuelga el
// listbox de <body>, fuera del árbol de React.
import "@/components/quote-flow/places-autocomplete.css";
import {
  ANALYTICS_EVENTS,
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
import { whatsappErrorMessage } from "@/lib/content/whatsapp-errors";
import { EMPTY_GEO, type PlaceGeo } from "@/lib/google-places";
import { parseArWhatsapp } from "@/lib/phone";
import { isValidPlate, normalizePlateInput } from "@/lib/plate";
import { cn } from "@/lib/utils";

type TallerContent = (typeof moduloPedidoContent)["taller"];

/** Copy que necesita la isla. Llega por props desde el server: no se empaqueta en el JS. */
export type ModuloFormCopy = {
  readonly problema: TallerContent["problema"];
  readonly zona: TallerContent["zona"];
  readonly next: string;
  readonly chipsLabel: string;
  readonly contact: TallerContent["contact"];
  readonly sent: TallerContent["sent"];
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
  /** Nivel de los títulos del paso 2 y del enviado: lo decide la página. */
  readonly headingLevel: "h2" | "h3";
  readonly copy: ModuloFormCopy;
  readonly chips: readonly ModuloChip[];
  /** "¿Preferís chatear?" + WhatsApp (server, medido por `data-analytics-*`). */
  readonly whatsapp: React.ReactNode;
  /** Links a `/terminos` y `/privacidad` del consentimiento (server). */
  readonly consentLinks: { readonly terms: React.ReactNode; readonly privacy: React.ReactNode };
  /** Ícono del estado enviado (server). */
  readonly sentIcon: React.ReactNode;
  /** "Bajar la app" (server). */
  readonly appLink: React.ReactNode;
};

type FieldName = "problema" | "zona" | "whatsapp" | "patente";
type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName | "consent", string>>;

const EMPTY_VALUES: Values = { problema: "", zona: "", whatsapp: "", patente: "" };
const STEP_1_FIELDS: readonly FieldName[] = ["problema", "zona"];
const STEP_2_FIELDS: readonly FieldName[] = ["whatsapp", "patente"];

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

/**
 * Pestaña Taller del módulo de pedido: el único camino del módulo que
 * registra un pedido en el backend (`/api/presupuesto`, el mismo body que el
 * form de `/pedido`).
 *
 * Tres estados en el mismo lugar, siempre por acción de la persona (un
 * click o un Enter: el cambio de alto no cuenta como CLS):
 *
 * 1. "¿Qué le pasa?" + "¿Dónde estás?" + "Pedir propuestas", con los chips
 *    de "Lo más pedido" y la salida por WhatsApp.
 * 2. Resumen + WhatsApp + patente opcional (recomendada) + consentimiento
 *    (checkbox desmarcado y obligatorio, decisión de producto del
 *    2026-11-24) + "Enviar pedido".
 * 3. Enviado.
 *
 * Reglas y lógica del form viejo de `/pedido`, en `pedido-client.ts`: misma
 * validación del WhatsApp (`parseArWhatsapp`) y de la patente
 * (`isValidPlate`), lookup de la patente en clasific.ar al salir del campo
 * (nunca bloquea el envío), Google Places recién al enfocar "¿Dónde estás?".
 */
export function ModuloForm({
  idPrefix,
  placement,
  headingLevel: Heading,
  copy,
  chips,
  whatsapp,
  consentLinks,
  sentIcon,
  appLink,
}: ModuloFormProps) {
  const [step, setStep] = useState<1 | 2 | "sent">(1);
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [geo, setGeo] = useState<PlaceGeo>(EMPTY_GEO);
  const [attempted, setAttempted] = useState<{ 1: boolean; 2: boolean }>({ 1: false, 2: false });
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [publicCode, setPublicCode] = useState<string | null>(null);
  // Consentimiento real: arranca desmarcado y viaja con su valor.
  const [consent, setConsent] = useState(false);

  const problemaRef = useRef<HTMLInputElement>(null);
  const zonaRef = useRef<HTMLInputElement>(null);
  const whatsappRef = useRef<HTMLInputElement>(null);
  const patenteRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const startedRef = useRef(false);
  const step2TrackedRef = useRef(false);
  // A dónde va el foco después del próximo cambio de paso.
  const focusAfterRef = useRef<"heading" | "problema" | null>(null);

  const ids = {
    problema: `${idPrefix}-que`,
    zona: `${idPrefix}-zona`,
    whatsapp: `${idPrefix}-whatsapp`,
    patente: `${idPrefix}-patente`,
    consent: `${idPrefix}-consentimiento`,
    chips: `${idPrefix}-chips`,
    heading: `${idPrefix}-paso`,
  };
  const fieldRefs: Record<FieldName, React.RefObject<HTMLInputElement | null>> = {
    problema: problemaRef,
    zona: zonaRef,
    whatsapp: whatsappRef,
    patente: patenteRef,
  };

  const ensurePlaces = usePlacesAutocomplete(zonaRef, (selection) => {
    setValues((current) => ({ ...current, zona: selection.value }));
    setGeo(selection.geo);
  });
  const { plateCheck, startPlateLookup, snapshotForSubmit, abortPlateLookup } =
    usePlateLookup(values.patente);

  // Foco después de cambiar de paso: el título nuevo (que se lee) o, al
  // volver, "¿Qué le pasa?".
  useEffect(() => {
    const target = focusAfterRef.current;
    focusAfterRef.current = null;
    if (target === "heading") headingRef.current?.focus();
    if (target === "problema") problemaRef.current?.focus();
  }, [step]);

  // ── Validación (misma regla que `/pedido`) ─────────────────────────────

  const allErrors: Errors = {};
  if (!values.problema.trim()) allErrors.problema = copy.problema.error;
  if (!values.zona.trim()) allErrors.zona = copy.zona.error;
  const phone = parseArWhatsapp(values.whatsapp);
  if (!phone.ok) allErrors.whatsapp = whatsappErrorMessage(phone.error, phone.diff);
  if (values.patente && !isValidPlate(values.patente)) {
    allErrors.patente = copy.contact.patente.error;
  }
  if (!consent) allErrors.consent = copy.contact.consent.error;
  // Un error se ve después del primer intento de su paso o, en WhatsApp y
  // patente, después de salir del campo. Desde ahí se corrige en vivo.
  const errors: Errors = {};
  for (const name of STEP_1_FIELDS) {
    if (allErrors[name] && attempted[1]) errors[name] = allErrors[name];
  }
  for (const name of STEP_2_FIELDS) {
    if (allErrors[name] && (attempted[2] || touched[name])) errors[name] = allErrors[name];
  }
  // El del consentimiento, solo después de intentar enviar (aparece por
  // interacción: no cuenta como CLS).
  if (allErrors.consent && attempted[2]) errors.consent = allErrors.consent;

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

  function goToStep2(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted((current) => ({ ...current, 1: true }));
    const firstInvalid = STEP_1_FIELDS.find((name) => allErrors[name]);
    if (firstInvalid) {
      fieldRefs[firstInvalid].current?.focus();
      return;
    }
    markStarted();
    if (!step2TrackedRef.current) {
      step2TrackedRef.current = true;
      track(ANALYTICS_EVENTS.quoteStepViewed, { flow: QUOTE_FLOWS.page, step: 2, ...moduleProps });
    }
    focusAfterRef.current = "heading";
    setStep(2);
  }

  function backToStep1() {
    focusAfterRef.current = "problema";
    setStep(1);
  }

  function handleBlur(name: "whatsapp" | "patente") {
    setTouched((current) => (current[name] ? current : { ...current, [name]: true }));
    // Salió de la patente con una válida: se valida en clasific.ar.
    if (name === "patente" && isValidPlate(values.patente)) startPlateLookup(values.patente);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "submitting") return;

    setAttempted((current) => ({ ...current, 2: true }));
    const firstInvalid = STEP_2_FIELDS.find((name) => allErrors[name]);
    if (firstInvalid) {
      fieldRefs[firstInvalid].current?.focus();
      return;
    }
    if (!consent) {
      consentRef.current?.focus();
      return;
    }

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
      return;
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
    focusAfterRef.current = "heading";
    setStep("sent");
  }

  function reset() {
    setValues(EMPTY_VALUES);
    setGeo(EMPTY_GEO);
    setAttempted({ 1: false, 2: false });
    setTouched({});
    setPublicCode(null);
    setConsent(false);
    focusAfterRef.current = "problema";
    setStep(1);
  }

  const describedBy = (name: FieldName | "consent", ...extra: (string | false | undefined)[]) =>
    [...extra, errors[name] ? `${ids[name]}-error` : null].filter(Boolean).join(" ") ||
    undefined;

  // ── Enviado ────────────────────────────────────────────────────────────

  if (step === "sent") {
    return (
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-panel border border-control-line bg-card p-5 text-left md:p-7">
        {sentIcon}
        <div className="min-w-0 flex-1 basis-72">
          <Heading
            id={ids.heading}
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-xl font-bold text-fg outline-none md:text-2xl"
          >
            {copy.sent.title}
          </Heading>
          <p className="mt-1 text-base text-fg-muted">{copy.sent.body}</p>
          {publicCode ? (
            <p className="mt-1 text-base font-semibold text-fg tabular-nums">
              {copy.sent.code.replace("{code}", publicCode)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {appLink}
          <button
            type="button"
            onClick={reset}
            className="min-h-12 px-1 text-sm font-semibold text-fg-muted underline underline-offset-4 hover:text-fg"
          >
            {copy.sent.again}
          </button>
        </div>
      </div>
    );
  }

  // ── Paso 2: WhatsApp y patente ─────────────────────────────────────────

  if (step === 2) {
    const submitting = status.kind === "submitting";
    const plateNow =
      plateCheck.kind !== "idle" && plateCheck.plate === values.patente ? plateCheck : null;
    const plateStatus: FieldStatus = errors.patente
      ? "invalid"
      : plateNow?.kind === "validating"
        ? "validating"
        : plateNow?.kind === "valid"
          ? "valid"
          : plateNow?.kind === "unverified"
            ? "notice"
            : "idle";
    const whatsappStatus: FieldStatus = errors.whatsapp
      ? "invalid"
      : touched.whatsapp || attempted[2]
        ? "valid"
        : "idle";
    const c = copy.contact;

    return (
      <div className="flex flex-col gap-4 rounded-panel border border-control-line bg-card p-5 text-left md:p-7">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
          {/* `ph-no-capture`: lo que escribió la persona, fuera de un input,
              queda fuera de la grabación de sesiones. */}
          <p className="ph-no-capture inline-flex min-w-0 items-center rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold break-words text-action">
            <span className="sr-only">{c.summaryLabel} </span>
            {values.problema.trim()} · {values.zona.trim()}
          </p>
          <button
            type="button"
            onClick={backToStep1}
            className="min-h-11 text-sm font-semibold text-fg-muted underline underline-offset-4 hover:text-fg"
          >
            {c.change}
          </button>
        </div>

        <Heading
          id={ids.heading}
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-xl font-bold text-fg outline-none md:text-2xl"
        >
          {c.title}
        </Heading>

        <form noValidate onSubmit={submit} aria-labelledby={ids.heading} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            {/* WhatsApp: un solo control visual, el `+54` es parte del campo. */}
            <div className="flex min-w-0 flex-col gap-1.5 md:flex-2">
              <label htmlFor={ids.whatsapp} className="text-label font-semibold text-fg">
                {c.whatsapp.label}
              </label>
              <div
                className={cn(
                  "flex h-14 overflow-clip rounded-full border bg-card transition-colors motion-reduce:transition-none",
                  "outline-brand has-focus-visible:border-action has-focus-visible:outline-2 has-focus-visible:outline-offset-2",
                  errors.whatsapp ? "border-status-alert" : "border-control-line-strong hover:border-fg-muted",
                )}
              >
                <span
                  id={`${ids.whatsapp}-prefix`}
                  className="flex shrink-0 items-center border-r border-control-line bg-card-muted pr-3 pl-5 text-base text-fg-muted"
                >
                  <span aria-hidden="true">{c.whatsapp.prefix}</span>
                  <span className="sr-only">{c.whatsapp.prefixLabel}</span>
                </span>
                <div className="relative min-w-0 flex-1">
                  <WhatsappInput
                    id={ids.whatsapp}
                    ref={whatsappRef}
                    autoComplete="tel-national"
                    required
                    value={values.whatsapp}
                    onValueChange={(value) => setField("whatsapp", value)}
                    onBlur={() => handleBlur("whatsapp")}
                    placeholder={c.whatsapp.placeholder}
                    aria-invalid={errors.whatsapp ? true : undefined}
                    aria-describedby={describedBy("whatsapp", `${ids.whatsapp}-prefix`)}
                    className={cn(
                      "h-full rounded-none border-0 bg-transparent py-0 pl-3 text-base text-fg placeholder:text-fg-subtle",
                      FIELD_STATUS_PADDING,
                    )}
                  />
                  <FieldStatusIcon status={whatsappStatus} />
                </div>
              </div>
              {errors.whatsapp ? (
                <p id={`${ids.whatsapp}-error`} className="px-5 text-label font-medium text-status-alert">
                  {errors.whatsapp}
                </p>
              ) : null}
            </div>

            {/* Patente: opcional pero recomendada. */}
            <div className="flex min-w-0 flex-col gap-1.5 md:flex-1">
              <label htmlFor={ids.patente} className="text-label font-semibold text-fg">
                {c.patente.label} <span className="font-normal">{c.patente.optional}</span>
              </label>
              <div className="relative">
                <input
                  id={ids.patente}
                  ref={patenteRef}
                  type="text"
                  value={values.patente}
                  onChange={(event) => setField("patente", normalizePlateInput(event.target.value))}
                  onBlur={() => handleBlur("patente")}
                  placeholder={c.patente.placeholder}
                  maxLength={9}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  aria-invalid={errors.patente ? true : undefined}
                  aria-busy={plateStatus === "validating" || undefined}
                  aria-describedby={describedBy(
                    "patente",
                    `${ids.patente}-hint`,
                    `${ids.patente}-status`,
                  )}
                  className={cn(
                    pillInputVariants({ size: "56" }),
                    FIELD_STATUS_PADDING,
                    "tracking-wide uppercase placeholder:normal-case",
                  )}
                />
                <FieldStatusIcon status={plateStatus} />
              </div>
              {errors.patente ? (
                <p id={`${ids.patente}-error`} className="px-5 text-label font-medium text-status-alert">
                  {errors.patente}
                </p>
              ) : null}
            </div>

          </div>

          <p id={`${ids.patente}-hint`} className="text-label text-fg-muted">
            {c.patente.hint}
          </p>
          <PlateStatus id={`${ids.patente}-status`} check={plateCheck} plate={values.patente} copy={c.patente.status} />

          {/* Consentimiento: checkbox nativo desmarcado y obligatorio. Todo el
              renglón es el label (objetivo táctil de 44px o más). Los links
              abren en otra pestaña y no marcan el checkbox. */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={ids.consent}
              className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm text-fg-muted"
            >
              <input
                id={ids.consent}
                ref={consentRef}
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                required
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={describedBy("consent")}
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-action"
              />
              <span>
                {c.consent.prefix}
                {consentLinks.terms}
                {c.consent.middle}
                {consentLinks.privacy}
                {c.consent.suffix}
              </span>
            </label>
            {errors.consent ? (
              <p id={`${ids.consent}-error`} className="pl-8 text-label font-medium text-status-alert">
                {errors.consent}
              </p>
            ) : null}
          </div>

          {/* Siempre en el DOM (vacía en reposo): si se montara junto con el
              texto, el lector de pantalla no anunciaría el error. */}
          <div aria-live="assertive">
            {status.kind === "error" ? (
              <p className="text-sm font-medium text-status-alert">{status.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-label text-fg-muted">{c.note}</p>
            <Button
              type="submit"
              variant="primary"
              size="56"
              className="max-md:w-full md:shrink-0"
              disabled={submitting}
              aria-busy={submitting || undefined}
            >
              {submitting ? c.submitting : c.submit}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ── Paso 1: qué le pasa y dónde ────────────────────────────────────────

  const step1Errors = STEP_1_FIELDS.filter((name) => errors[name]);
  // Celda de un campo dentro de la barra: el anillo de foco va en la celda
  // (el input no tiene borde propio). Anillo hacia adentro: en celular la
  // tarjeta recorta lo que sale de sus bordes redondeados.
  const cell =
    "flex min-w-0 flex-col outline-brand focus-within:outline-2 focus-within:-outline-offset-2 md:rounded-full";
  const barInput =
    "h-8 w-full border-0 bg-transparent p-0 text-base text-fg outline-none placeholder:text-fg-subtle md:h-7";

  return (
    <div className="flex flex-col gap-4.5">
      <form noValidate onSubmit={goToStep2} onFocusCapture={onFocusCapture}>
        <div
          className={cn(
            "flex flex-col overflow-hidden rounded-panel border bg-card",
            "md:h-18 md:flex-row md:items-center md:overflow-visible md:rounded-full md:pr-2",
            step1Errors.length > 0 ? "border-status-alert" : "border-control-line-strong",
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
              placeholder={copy.problema.placeholder}
              aria-invalid={errors.problema ? true : undefined}
              aria-describedby={describedBy("problema")}
              className={barInput}
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
            type="submit"
            variant="primary"
            size="56"
            className="mx-2 mb-2 h-13 shrink-0 rounded-card md:m-0 md:h-14 md:rounded-full"
          >
            {copy.next}
          </Button>
        </div>
        {step1Errors.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-1 px-5">
            {step1Errors.map((name) => (
              <li key={name} id={`${ids[name]}-error`} className="text-label font-medium text-status-alert">
                {errors[name]}
              </li>
            ))}
          </ul>
        ) : null}
      </form>

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

      {whatsapp}
    </div>
  );
}

/**
 * Estado del lookup debajo de la patente (mismo criterio que `/pedido`). La
 * región `aria-live` existe siempre: "Validando…" y "Patente validada" solo
 * se leen (el ícono ya lo muestra); "No pudimos validarla…" también se ve.
 */
function PlateStatus({
  id,
  check,
  plate,
  copy,
}: {
  readonly id: string;
  readonly check: PlateCheck;
  readonly plate: string;
  readonly copy: TallerContent["contact"]["patente"]["status"];
}) {
  const current = check.kind !== "idle" && check.plate === plate ? check : null;
  return (
    <p
      id={id}
      aria-live="polite"
      className={cn(current?.kind === "unverified" ? "-mt-2 text-label text-fg-muted" : "sr-only")}
    >
      {current?.kind === "validating" ? copy.validating : null}
      {current?.kind === "valid" ? copy.valid : null}
      {current?.kind === "unverified" ? copy.unverified : null}
    </p>
  );
}
