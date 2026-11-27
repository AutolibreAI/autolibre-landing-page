"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button, ButtonAnchor } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PillInput } from "@/components/ui/pill-input";
import { PillSelect } from "@/components/ui/pill-select";
import { WhatsappInput } from "@/components/ui/whatsapp-input";
import {
  ANALYTICS_EVENTS,
  LEAD_SOURCES,
  QUOTE_FLOWS,
  QUOTE_MODULE_PLACEMENTS,
  type LeadSource,
  type QuoteModulePlacement,
  type QuoteTab,
} from "@/lib/analytics/events";
import { createMetaEventId } from "@/lib/analytics/meta-pixel";
import { getPostHogIds } from "@/lib/analytics/posthog";
import { track } from "@/lib/analytics/track";
import {
  formatAmountInput,
  isValidAge,
  isValidAmount,
  isValidConsultaEmail,
  normalizeAgeInput,
  normalizeAmountInput,
  normalizeConsultaEmail as normalizeEmail,
  normalizePostalCodeInput,
  postalCodeDigits,
} from "@/lib/consulta-fields";
import type { InquiryKind, InquiryRequest } from "@/lib/consulta-inquiry";
import type { ConsultaContent, ConsultaField } from "@/lib/content/modulo-pedido";
import { whatsappErrorMessage } from "@/lib/content/whatsapp-errors";
import { formatCuit, isValidCuit, normalizeCuitInput } from "@/lib/cuit";
import { parseArWhatsapp } from "@/lib/phone";
import { isValidPlate, normalizePlateInput } from "@/lib/plate";
import { cn } from "@/lib/utils";

type ModuloConsultaFormProps = {
  readonly idPrefix: string;
  readonly tab: QuoteTab;
  readonly placement: QuoteModulePlacement;
  /** A qué endpoint del backend va la consulta (`insurance` / `financing`). */
  readonly kind: InquiryKind;
  /** Copy que necesita la isla. Llega por props desde el server. */
  readonly copy: Omit<ConsultaContent, "title" | "body">;
  /** Link a `/privacidad` del consentimiento y de la nota (server, con `key`). */
  readonly privacyLink: React.ReactNode;
  /**
   * `https://wa.me/<número>?text=` (lo arma el server con `whatsappUrl("")`),
   * para la salida por WhatsApp del error: la isla solo le pega el mensaje,
   * sin empaquetar `siteConfig`.
   */
  readonly whatsappBase: string;
  /** "(se abre en otra pestaña)", para lectores de pantalla. */
  readonly externalHint: string;
  /** Igual que el WhatsApp de Taller: `whatsapp` solo en `/pedido`. */
  readonly leadSource?: LeadSource;
};

type Values = Record<string, string>;

/** Clave del consentimiento en los errores de `/api/consulta` (`INQUIRY_CONSENT_FIELD`). */
const CONSENT_FIELD = "consent";

type SubmitState =
  | { readonly kind: "idle" }
  | { readonly kind: "sending" }
  | { readonly kind: "done"; readonly publicCode: string | null }
  | {
      readonly kind: "error";
      readonly message: string;
      /** Ofrecer la salida por WhatsApp (todo error que no sea de un campo ni el 429). */
      readonly whatsapp: boolean;
    };

/** Normalización mientras se escribe. El email se normaliza al salir del campo. */
function normalize(field: ConsultaField, raw: string): string {
  if (field.kind !== "text") return raw;
  if (field.format === "cuit") return normalizeCuitInput(raw);
  if (field.format === "plate") return normalizePlateInput(raw);
  if (field.format === "postal-code") return normalizePostalCodeInput(raw);
  if (field.format === "age") return normalizeAgeInput(raw);
  if (field.format === "amount") return normalizeAmountInput(raw);
  return raw;
}

function fieldError(field: ConsultaField, raw: string): string | undefined {
  if (field.kind === "whatsapp") {
    // Misma regla y mismos mensajes que el WhatsApp de Taller.
    const phone = parseArWhatsapp(raw);
    return phone.ok ? undefined : whatsappErrorMessage(phone.error, phone.diff);
  }
  const value = raw.trim();
  if (!value) return field.required ? field.error : undefined;
  if (field.kind !== "text") return undefined;
  if (field.format === "cuit" && !isValidCuit(value)) return field.invalid;
  if (field.format === "plate" && !isValidPlate(value)) return field.invalid;
  if (field.format === "postal-code" && !postalCodeDigits(value)) return field.invalid;
  if (field.format === "age" && !isValidAge(value)) return field.invalid;
  if (field.format === "email" && !isValidConsultaEmail(value)) return field.invalid;
  if (field.format === "amount" && !isValidAmount(value)) return field.invalid;
  return undefined;
}

/**
 * Lo que viaja en el mensaje de WhatsApp de la salida de error: el texto de
 * la opción elegida, el CUIT con guiones, del código postal sus 4 dígitos
 * (aunque hayan pegado un CPA), el WhatsApp canónico (`+549XXXXXXXXXX`), el
 * email en minúsculas y el monto con su símbolo (`$ 1.500.000`). Un valor
 * vacío (o un monto inválido) devuelve `""`: ese renglón no se arma.
 */
function messageValue(field: ConsultaField, raw: string): string {
  if (field.kind === "whatsapp") {
    const phone = parseArWhatsapp(raw);
    return phone.ok ? `+${phone.canonical}` : "";
  }
  const value = raw.trim();
  if (field.kind === "select") {
    return field.options.find((option) => option.id === value)?.label ?? "";
  }
  if (field.format === "cuit") return formatCuit(value);
  if (field.format === "postal-code") return postalCodeDigits(value) ?? value;
  if (field.format === "email") return normalizeEmail(value);
  if (field.format === "amount") {
    return isValidAmount(value) ? `${field.messagePrefix ?? ""}${normalizeAmountInput(value)}` : "";
  }
  return value;
}

/**
 * Form de las pestañas Seguros y Financiación del módulo de pedido. Isla
 * hoja: el título y la bajada del panel los pone el server (`ModuloPedido`).
 *
 * Tres bloques: los datos propios de la pestaña (`copy.fields`), el contacto
 * (`copy.contact`: WhatsApp con el control de Taller, y email) y el
 * consentimiento (casilla desmarcada y obligatoria, como la de Taller pero
 * con su propio texto).
 *
 * El envío es SOLO por formulario (decisión del 2026-11-27): el submit hace
 * el POST a `/api/consulta` (`submitConsulta`) y espera la respuesta. Con el
 * OK se muestra la confirmación con el número de consulta. Si falla, el
 * error se muestra: el de un campo, en ese campo (con el foco); el resto,
 * arriba del botón, con los datos intactos para reintentar y, como salida,
 * un link al WhatsApp de AutoLibre con la consulta ya armada. Ese link es el
 * único WhatsApp del form. El backend no es idempotente: `sendingRef` corta
 * el doble click/Enter, y tras un éxito el form ya no está.
 *
 * Medición: `quote_started` en la primera interacción, `quote_submitted`
 * (PostHog desde la route; acá el Pixel de Meta con el `eventID` compartido
 * con la Conversions API), `quote_failed` y, en la salida de error,
 * `whatsapp_clicked` con `fallback`. Todos con `tab` y `placement`; nunca
 * viaja el valor de un campo (y el form va con `ph-no-capture`: tiene
 * nombre, CUIT, WhatsApp y email).
 */
export function ModuloConsultaForm({
  idPrefix,
  tab,
  placement,
  kind,
  copy,
  privacyLink,
  whatsappBase,
  externalHint,
  leadSource,
}: ModuloConsultaFormProps) {
  const { fields, contact } = copy;
  const allFields = [...fields, ...contact];

  const [values, setValues] = useState<Values>({});
  // Consentimiento real: arranca desmarcado.
  const [consent, setConsent] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  // Estado del envío y errores de campo que devolvió la route.
  const [submit, setSubmit] = useState<SubmitState>({ kind: "idle" });
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  // POST en vuelo (ref: un doble click o un Enter llegan antes del re-render).
  const sendingRef = useRef(false);

  const startedRef = useRef(false);
  const doneTitleRef = useRef<HTMLParagraphElement>(null);
  // Qué enfocar después del próximo render (el campo puede estar deshabilitado antes).
  const focusAfterRenderRef = useRef<string | null>(null);
  // Dónde dejar el cursor de un campo que se reformatea mientras se escribe (el monto).
  const caretAfterRenderRef = useRef<{ readonly id: string; readonly caret: number } | null>(null);

  const fieldId = (name: string) => `${idPrefix}-${tab}-${name}`;
  const consentId = fieldId("consentimiento");
  const errorId = fieldId("error");
  const firstFieldId = fieldId(fields[0].name);
  const valueOf = (name: string) => values[name] ?? "";

  const done = submit.kind === "done";
  const sending = submit.kind === "sending";

  // Foco después de cada cambio de estado: al título de la confirmación, al
  // campo o al mensaje de error, o al primer campo al volver al form.
  useEffect(() => {
    if (done) {
      doneTitleRef.current?.focus({ preventScroll: true });
      return;
    }
    const target = focusAfterRenderRef.current;
    if (!target) return;
    focusAfterRenderRef.current = null;
    document.getElementById(target)?.focus();
  }, [done, submit, serverErrors]);

  // Después de que React escribió el valor reformateado, antes de pintar
  // (igual que `WhatsappInput`): sin esto el cursor salta al final.
  useLayoutEffect(() => {
    const pending = caretAfterRenderRef.current;
    caretAfterRenderRef.current = null;
    if (!pending) return;
    const input = document.getElementById(pending.id);
    if (!(input instanceof HTMLInputElement) || document.activeElement !== input) return;
    input.setSelectionRange(pending.caret, pending.caret);
  }, [values]);

  /** `quote_started`: primera interacción, una vez por montaje. */
  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    track(ANALYTICS_EVENTS.quoteStarted, { flow: QUOTE_FLOWS.page, tab, placement });
  }

  /** Saca el error que marcó el server sobre un campo: ya no aplica. */
  function clearServerError(name: string) {
    setServerErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function setValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    clearServerError(name);
  }

  /**
   * El monto se reformatea en cada tecla (`1.500.000`): la regla es
   * `formatAmountInput` (pura); acá se le pasa el cursor y el sentido del
   * borrado, y el cursor vuelve a su lugar después del render.
   */
  function handleAmountChange(field: ConsultaField, event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const current = valueOf(field.name);
    const inputType = (event.nativeEvent as InputEvent).inputType ?? "";
    const deletion = inputType.startsWith("deleteContentBackward")
      ? "backward"
      : inputType.startsWith("deleteContentForward")
        ? "forward"
        : undefined;
    const next = formatAmountInput(input.value, input.selectionStart ?? input.value.length, {
      previous: current,
      deletion,
    });
    if (next.value === current) {
      // Mismo valor (tope de dígitos, o una tecla que no es un número): React
      // no re-renderiza, así que el input se acomoda acá mismo.
      input.value = next.value;
      input.setSelectionRange(next.caret, next.caret);
      return;
    }
    caretAfterRenderRef.current = { id: input.id, caret: next.caret };
    setValue(field.name, next.value);
  }

  function handleBlur(field: ConsultaField) {
    setTouched((current) => (current[field.name] ? current : { ...current, [field.name]: true }));
    // El email se normaliza al salir (trim + minúsculas), no mientras se
    // escribe: reescribirlo en cada tecla movería el cursor.
    if (field.kind === "text" && field.format === "email") {
      const normalized = normalizeEmail(valueOf(field.name));
      if (normalized !== valueOf(field.name)) setValue(field.name, normalized);
    }
  }

  /**
   * Link al WhatsApp de AutoLibre con la consulta armada, un renglón por
   * campo. Solo para la salida de error: que la consulta no se pierda.
   */
  function whatsappHref(): string {
    const lines = allFields
      .map((field) => ({
        label: (field.kind === "text" ? field.messageLabel : undefined) ?? field.label,
        value: messageValue(field, valueOf(field.name)),
      }))
      .filter((line) => line.value)
      .map((line) => `${line.label}: ${line.value}`);
    return whatsappBase + encodeURIComponent([copy.messageIntro, ...lines].join("\n"));
  }

  /**
   * POST a `/api/consulta`, esperando la respuesta. Manda los valores crudos
   * por nombre de campo: la route revalida, normaliza, mapea los ids de las
   * opciones a los enums del backend y arma el body del contrato
   * (`lib/consulta-inquiry.ts`).
   */
  async function submitConsulta() {
    // El backend no es idempotente: nunca dos POST por doble click o Enter.
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSubmit({ kind: "sending" });
    setServerErrors({});

    // Mismo ID para el evento del Pixel y el de la Conversions API.
    const metaEventId = createMetaEventId();
    const posthogIds = getPostHogIds();
    const request: InquiryRequest = {
      kind,
      values: Object.fromEntries(allFields.map((field) => [field.name, valueOf(field.name)])),
      consent,
      // Solo medición (los consume la route; al backend no llegan).
      placement,
      metaEventId,
      posthogDistinctId: posthogIds?.distinctId,
      posthogSessionId: posthogIds?.sessionId,
    };

    let response: Response | null = null;
    let data: { publicCode?: unknown; error?: unknown; field?: unknown } | null = null;
    try {
      response = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      data = await response.json().catch(() => null);
    } catch {
      response = null;
    }
    sendingRef.current = false;

    if (response?.ok) {
      // Meta, con el `eventID` de la Conversions API (`Lead` en `/pedido`,
      // `Contact` en el Home: lo decide el catálogo). En PostHog
      // `quote_submitted` lo manda la route.
      track(
        ANALYTICS_EVENTS.quoteSubmitted,
        {
          flow: QUOTE_FLOWS.page,
          tab,
          placement,
          ...(placement === QUOTE_MODULE_PLACEMENTS.pedido
            ? { lead_source: LEAD_SOURCES.form }
            : {}),
        },
        { metaEventId },
      );
      setSubmit({
        kind: "done",
        publicCode:
          typeof data?.publicCode === "string" && data.publicCode.trim()
            ? data.publicCode.trim()
            : null,
      });
      return;
    }

    track(ANALYTICS_EVENTS.quoteFailed, {
      flow: QUOTE_FLOWS.page,
      tab,
      placement,
      ...(response ? { reason: "server", status: response.status } : { reason: "network" }),
    });

    // El texto que manda la route siempre es propio y en español (nunca el
    // del backend).
    const routeMessage = typeof data?.error === "string" && data.error ? data.error : null;
    const routeField = typeof data?.field === "string" ? data.field : null;

    // 400 atribuible a un campo: se marca el campo y el foco va ahí.
    if (response?.status === 400 && routeField && routeMessage) {
      const known = routeField === CONSENT_FIELD || allFields.some((f) => f.name === routeField);
      if (known) {
        setServerErrors({ [routeField]: routeMessage });
        focusAfterRenderRef.current =
          routeField === CONSENT_FIELD ? consentId : fieldId(routeField);
        setSubmit({ kind: "idle" });
        return;
      }
    }

    focusAfterRenderRef.current = errorId;
    if (response?.status === 429) {
      setSubmit({
        kind: "error",
        message: routeMessage ?? copy.errors.rateLimited,
        whatsapp: false,
      });
    } else if (response?.status === 400) {
      setSubmit({ kind: "error", message: routeMessage ?? copy.errors.rejected, whatsapp: true });
    } else {
      // 5xx, 503 o sin red: mensaje propio, reintento y salida por WhatsApp.
      setSubmit({ kind: "error", message: copy.errors.failed, whatsapp: true });
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current) return;
    setAttempted(true);
    const firstInvalid = allFields.find((field) => fieldError(field, valueOf(field.name)));
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid.name))?.focus();
      return;
    }
    if (!consent) {
      document.getElementById(consentId)?.focus();
      return;
    }
    markStarted();
    void submitConsulta();
  }

  /** Form vacío para otra consulta. */
  function startOver() {
    setValues({});
    setConsent(false);
    setAttempted(false);
    setTouched({});
    setServerErrors({});
    focusAfterRenderRef.current = firstFieldId;
    setSubmit({ kind: "idle" });
  }

  if (submit.kind === "done") {
    return (
      <div role="status" className="flex flex-col items-start gap-4">
        <div>
          <p
            ref={doneTitleRef}
            tabIndex={-1}
            className="font-display text-lg font-bold text-fg outline-none"
          >
            {copy.success.title}
          </p>
          {/* Número de consulta: solo si el backend lo devolvió. */}
          {submit.publicCode ? (
            <p className="mt-1 text-base text-fg-muted">
              {copy.success.code.before}
              <strong className="font-semibold text-fg tabular-nums">{submit.publicCode}</strong>
              {copy.success.code.after}
            </p>
          ) : null}
          <p className="mt-1 text-base text-fg-muted">{copy.success.body}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="48"
          onClick={startOver}
          className="max-sm:w-full"
        >
          {copy.success.again}
        </Button>
      </div>
    );
  }

  const requiredMark = (
    <span className="text-brand-hover" aria-hidden="true">
      {" "}
      *
    </span>
  );

  function renderField(field: ConsultaField) {
    const id = fieldId(field.name);
    const value = valueOf(field.name);
    // El error del server sobre el campo manda hasta que la persona lo edita.
    const error =
      serverErrors[field.name] ??
      (attempted || touched[field.name] ? fieldError(field, value) : undefined);

    if (field.kind === "whatsapp") {
      const describedBy = [
        `${id}-prefix`,
        field.hint ? `${id}-hint` : null,
        error ? `${id}-error` : null,
      ]
        .filter(Boolean)
        .join(" ");
      // El mismo control que el paso final de Taller (`RequestFlowOverlay`):
      // `+54` fijo y `WhatsappInput`, que formatea mientras se escribe.
      return (
        <div key={field.name} className="flex flex-col gap-1.5">
          <label htmlFor={id} className="text-label font-semibold text-fg">
            {field.label}
            {requiredMark}
          </label>
          <div
            className={cn(
              "flex h-13 overflow-clip rounded-full border bg-card transition-colors motion-reduce:transition-none",
              "outline-brand has-focus-visible:border-action has-focus-visible:outline-2 has-focus-visible:outline-offset-2",
              error ? "border-status-alert" : "border-control-line-strong hover:border-fg-muted",
            )}
          >
            <span
              id={`${id}-prefix`}
              className="flex shrink-0 items-center border-r border-control-line bg-card-muted pr-3 pl-5 text-base text-fg-muted"
            >
              <span aria-hidden="true">{field.prefix}</span>
              <span className="sr-only">{field.prefixLabel}</span>
            </span>
            <WhatsappInput
              id={id}
              name={field.name}
              // `tel-national`, como Taller: el `+54` ya está fijo delante.
              autoComplete="tel-national"
              required
              value={value}
              onValueChange={(next) => setValue(field.name, next)}
              onBlur={() => handleBlur(field)}
              placeholder={field.placeholder}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent py-0 pl-3 text-base text-fg placeholder:text-fg-subtle"
            />
          </div>
          {field.hint ? (
            <p id={`${id}-hint`} className="px-5 text-label text-fg-muted">
              {field.hint}
            </p>
          ) : null}
          {error ? (
            <p id={`${id}-error`} className="px-5 text-label font-medium text-status-alert">
              {error}
            </p>
          ) : null}
        </div>
      );
    }

    const label = field.optional ? (
      <>
        {field.label} <span className="font-normal text-fg-muted">{field.optional}</span>
      </>
    ) : (
      field.label
    );

    if (field.kind === "select") {
      return (
        <PillSelect
          key={field.name}
          id={id}
          name={field.name}
          label={label}
          size="52"
          required={field.required}
          autoComplete={field.autoComplete}
          hint={field.hint}
          error={error}
          value={value}
          onChange={(event) => setValue(field.name, event.target.value)}
          onBlur={() => handleBlur(field)}
        >
          <option value="">{field.placeholder}</option>
          {field.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </PillSelect>
      );
    }

    return (
      <PillInput
        key={field.name}
        id={id}
        name={field.name}
        type={field.format === "email" ? "email" : "text"}
        label={label}
        size="52"
        required={field.required}
        autoComplete={field.autoComplete}
        inputMode={field.inputMode}
        // Un email no se autocorrige ni se capitaliza.
        autoCapitalize={field.format === "email" ? "none" : undefined}
        spellCheck={field.format === "email" ? false : undefined}
        placeholder={field.placeholder}
        hint={field.hint}
        error={error}
        value={value}
        onChange={(event) =>
          field.format === "amount"
            ? handleAmountChange(field, event)
            : setValue(field.name, normalize(field, event.target.value))
        }
        onBlur={() => handleBlur(field)}
      />
    );
  }

  const consentError =
    serverErrors[CONSENT_FIELD] ?? (attempted && !consent ? copy.consent.error : undefined);

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      onFocusCapture={markStarted}
      aria-busy={sending || undefined}
      className="ph-no-capture flex flex-col gap-4"
    >
      {/* Durante el envío los campos no se editan: lo que se manda es lo que
          se ve. `fieldset disabled` los deshabilita a todos de una. */}
      <fieldset disabled={sending} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
        <div className="grid gap-4 md:grid-cols-2">{fields.map(renderField)}</div>
        <div className="grid gap-4 md:grid-cols-2">{contact.map(renderField)}</div>

        {/* Consentimiento: checkbox nativo desmarcado y obligatorio; todo el
            renglón es el label (mismo armado que el de Taller). */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor={consentId}
            className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm text-fg-muted"
          >
            <input
              id={consentId}
              type="checkbox"
              checked={consent}
              onChange={(event) => {
                setConsent(event.target.checked);
                clearServerError(CONSENT_FIELD);
              }}
              required
              aria-invalid={consentError ? true : undefined}
              aria-describedby={consentError ? `${consentId}-error` : undefined}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-action"
            />
            <span>
              {copy.consent.prefix}
              {privacyLink}
              {copy.consent.suffix}
            </span>
          </label>
          {consentError ? (
            <p id={`${consentId}-error`} className="pl-8 text-label font-medium text-status-alert">
              {consentError}
            </p>
          ) : null}
        </div>
      </fieldset>

      {/* Error de envío. El contenedor está siempre en el DOM, vacío en
          reposo, para que el error se anuncie al aparecer; `sr-only` en
          reposo lo saca del flujo y no suma un hueco al `gap`. */}
      <div aria-live="assertive" className={submit.kind === "error" ? undefined : "sr-only"}>
        {submit.kind === "error" ? (
          <div className="flex flex-col items-start gap-3 rounded-card border border-status-alert bg-card p-4">
            <p
              id={errorId}
              tabIndex={-1}
              className="text-base font-medium text-status-alert outline-none"
            >
              {submit.message}
            </p>
            {/* El único WhatsApp del form: la salida para que la consulta no se pierda. */}
            {submit.whatsapp ? (
              <>
                <p className="text-label text-fg-muted">{copy.errors.whatsappPrompt}</p>
                <ButtonAnchor
                  href={whatsappHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="whatsapp"
                  size="44"
                  className="max-sm:w-full"
                  onClick={() =>
                    track(ANALYTICS_EVENTS.whatsappClicked, {
                      placement,
                      tab,
                      lead_source: leadSource,
                      fallback: true,
                    })
                  }
                >
                  <Icon name="whatsapp" size={20} strokeWidth={1.8} />
                  {copy.errors.whatsappLabel}
                  <span className="sr-only"> {externalHint}</span>
                </ButtonAnchor>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
        <Button
          type="submit"
          variant="primary"
          size="52"
          className="shrink-0 max-md:w-full"
          disabled={sending}
        >
          {sending ? copy.submitting : submit.kind === "error" ? copy.retry : copy.submit}
        </Button>
        <p className="text-label text-fg-muted">
          {copy.note.prefix}
          {privacyLink}
          {copy.note.suffix}
        </p>
      </div>

      {/* Aviso del envío para lectores de pantalla (el botón ya lo dice a la vista). */}
      <p role="status" className="sr-only">
        {sending ? copy.submitting : ""}
      </p>
    </form>
  );
}
