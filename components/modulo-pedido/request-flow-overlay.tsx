"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PlateCheck } from "@/components/pedido/pedido-client";
import { Button } from "@/components/ui/button";
import { chipVariants } from "@/components/ui/chip";
import {
  FIELD_STATUS_PADDING,
  FieldStatusIcon,
  type FieldStatus,
} from "@/components/ui/field-status-icon";
import { pillInputVariants } from "@/components/ui/pill-input";
import { WhatsappInput } from "@/components/ui/whatsapp-input";
import type { moduloPedidoContent } from "@/lib/content/modulo-pedido";
import type { RequestFlowContent } from "@/lib/content/request-flow";
import { normalizePlateInput } from "@/lib/plate";
import {
  MILEAGE_MAX_KM,
  PARTS_SUPPLY,
  QUOTE_TIMINGS,
  todayInBuenosAires,
  type PartsSupply,
  type QuoteDetails,
  type QuoteTiming,
} from "@/lib/quote-details";
import { cn } from "@/lib/utils";

type ContactCopy = (typeof moduloPedidoContent)["taller"]["contact"];
type SentCopy = (typeof moduloPedidoContent)["taller"]["sent"];

/**
 * Por qué se cerró: la X / Esc antes de enviar (`"close"`), "Cambiar"
 * (`"change"`) o después de enviar (`"done"`: el módulo vuelve a cero).
 */
export type RequestFlowCloseReason = "close" | "change" | "done";

/** Campo del contacto que el padre encontró inválido al intentar enviar. */
export type ContactField = "whatsapp" | "patente" | "consent";

export type RequestFlowSubmitResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly invalid?: ContactField };

/**
 * Lo que la persona carga en el contacto vive en `ModuloForm` (lo usa su
 * envío, el lookup de la patente y su validación): acá llega controlado.
 */
type ContactState = {
  readonly whatsapp: string;
  readonly onWhatsappChange: (value: string) => void;
  readonly onWhatsappBlur: () => void;
  readonly patente: string;
  readonly onPatenteChange: (value: string) => void;
  readonly onPatenteBlur: () => void;
  /** Lookup de la patente en clasific.ar (lo dispara `onPatenteBlur`). */
  readonly plateCheck: PlateCheck;
  readonly consent: boolean;
  readonly onConsentChange: (value: boolean) => void;
  readonly errors: Partial<Record<ContactField, string>>;
};

type RequestFlowOverlayProps = {
  /** Rect de la barra del hero al tocar "Pedir propuestas" (el "First" del FLIP). */
  readonly from: DOMRect;
  /** Rect actual de la barra del hero (vuelta y resize). */
  readonly getOriginRect: () => DOMRect | null;
  readonly idPrefix: string;
  readonly copy: RequestFlowContent;
  readonly contactCopy: ContactCopy;
  readonly barLabels: { readonly problema: string; readonly zona: string };
  readonly problema: string;
  readonly zona: string;
  readonly contact: ContactState;
  /** Links a `/terminos` y `/privacidad` del consentimiento (server, con `key`). */
  readonly consentLinks: { readonly terms: React.ReactNode; readonly privacy: React.ReactNode };
  readonly submitting: boolean;
  readonly errorMessage: string | null;
  /** Valida el contacto y manda el pedido con los detalles. */
  readonly onSubmit: (details: QuoteDetails) => Promise<RequestFlowSubmitResult>;
  /** Terminó la animación de cierre. */
  readonly onClosed: (reason: RequestFlowCloseReason) => void;

  // ── Confirmación (después de enviar) ──
  readonly sentCopy: SentCopy;
  /** Código público que devolvió el envío (`AL-1042`); sin él, la oración no va. */
  readonly publicCode: string | null;
  /** Ícono del enviado (server, con `key`). */
  readonly sentIcon: React.ReactNode;
  /** Bloque de la app (`ModuloAppPromo`, server, con `key`): se monta recién al enviar. */
  readonly appPromo: React.ReactNode;
  /** Contenedor de la confirmación: `ModuloForm` mide ahí la vista del bloque y del QR. */
  readonly successRef: React.RefObject<HTMLDivElement | null>;
  /** La confirmación ya está en pantalla. */
  readonly onSuccessShown: () => void;
};

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Paso final del pedido en el Home. Al tocar "Pedir propuestas", la página
 * "se limpia": una capa fija de `bg-card` tapa todo (header incluido), la
 * barra del hero sube con una animación FLIP hasta arriba (ya como resumen,
 * sin inputs: la zona elegida en Google Places no se puede romper acá) y los
 * campos entran escalonados. No es un modal: no hay backdrop, tarjeta ni
 * `role="dialog"`; es la página transformándose. Mientras está abierta, el
 * resto del `<body>` queda `inert` y el scroll bloqueado.
 *
 * Campos (los del pedido de la app): para cuándo (con fecha si elige "Tengo
 * una fecha"), quién pone los repuestos, kilometraje, patente, WhatsApp y el
 * consentimiento. El envío lo hace `ModuloForm` (`onSubmit`); al registrarse,
 * los campos salen escalonados y la confirmación aparece en la misma capa
 * (código del pedido, qué pasa después y el bloque de la app). "Volver al
 * inicio", la X o Esc cierran y `ModuloForm` deja el módulo vacío.
 *
 * Animación: Web Animations API, sin CSS nuevo. Con
 * `prefers-reduced-motion: reduce` no corre ninguna: el cambio es instantáneo.
 */
export function RequestFlowOverlay(props: RequestFlowOverlayProps) {
  // Solo existe en el cliente (se monta por un click): el portal va directo
  // a `<body>` para que ningún ancestro con `transform` rompa el `fixed`.
  return createPortal(<RequestFlowSurface {...props} />, document.body);
}

function RequestFlowSurface({
  from,
  getOriginRect,
  idPrefix,
  copy,
  contactCopy,
  barLabels,
  problema,
  zona,
  contact,
  consentLinks,
  submitting,
  errorMessage,
  onSubmit,
  onClosed,
  sentCopy,
  publicCode,
  sentIcon,
  appPromo,
  successRef,
  onSuccessShown,
}: RequestFlowOverlayProps) {
  const ids = {
    heading: `${idPrefix}-final-titulo`,
    success: `${idPrefix}-final-enviado`,
    timing: `${idPrefix}-final-cuando`,
    date: `${idPrefix}-final-fecha`,
    parts: `${idPrefix}-final-repuestos`,
    mileage: `${idPrefix}-final-km`,
    patente: `${idPrefix}-final-patente`,
    whatsapp: `${idPrefix}-final-whatsapp`,
    consent: `${idPrefix}-final-consentimiento`,
  };

  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const fieldRefs = {
    whatsapp: useRef<HTMLInputElement>(null),
    patente: useRef<HTMLInputElement>(null),
    consent: useRef<HTMLInputElement>(null),
  };
  const closingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  // El pedido ya quedó registrado (aunque la confirmación todavía no se vea):
  // desde acá, cerrar siempre es `"done"` y el módulo vuelve a cero.
  const succeededRef = useRef(false);
  const [phase, setPhase] = useState<"form" | "sent">("form");

  // Mismos defaults que la app: lo antes posible y que los ponga el taller.
  const [timing, setTiming] = useState<QuoteTiming>(QUOTE_TIMINGS.asap);
  const [preferredDate, setPreferredDate] = useState("");
  const [partsSupply, setPartsSupply] = useState<PartsSupply>(PARTS_SUPPLY.workshop);
  const [mileage, setMileage] = useState("");
  const [dateAttempted, setDateAttempted] = useState(false);
  // Ancho de la barra del hero: la barra sube sin cambiar de tamaño y la
  // columna de campos usa el mismo. Se recalcula con el resize.
  const [width, setWidth] = useState(from.width);
  // Fecha de hoy en Buenos Aires (no la del navegador ni la de UTC).
  const [today] = useState(todayInBuenosAires);

  const dateError =
    timing !== QUOTE_TIMINGS.date
      ? null
      : !preferredDate
        ? copy.timing.date.missing
        : preferredDate < today
          ? copy.timing.date.past
          : null;
  const visibleDateError = dateAttempted ? dateError : null;

  // ── Montaje: bloqueo de scroll, `inert` del resto y animación de entrada ──
  useLayoutEffect(() => {
    const root = rootRef.current;
    const html = document.documentElement;
    const scrollY = window.scrollY;
    const previous = { overflow: html.style.overflow, paddingRight: html.style.paddingRight };
    // Compensa el ancho de la barra de scroll: sin esto, al ocultarla la
    // página se corre unos px debajo de la capa.
    const scrollbar = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`;

    // No es un dialog, pero el foco y los lectores de pantalla no se escapan
    // a la página tapada.
    const inerted: Element[] = [];
    for (const child of Array.from(document.body.children)) {
      if (child === root || child.hasAttribute("inert")) continue;
      child.setAttribute("inert", "");
      inerted.push(child);
    }

    headingRef.current?.focus({ preventScroll: true });

    if (!prefersReducedMotion()) {
      const bar = barRef.current;
      const last = bar?.getBoundingClientRect();
      if (bar && last) {
        bar.animate(
          [
            { transform: `translate(${from.left - last.left}px, ${from.top - last.top}px)` },
            { transform: "none" },
          ],
          { duration: 560, delay: 80, easing: EASE_OUT, fill: "both" },
        );
      }
      bgRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 280,
        easing: "ease-out",
        fill: "both",
      });
      closeRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 240,
        delay: 320,
        fill: "both",
      });
      root?.querySelectorAll<HTMLElement>("[data-stagger]").forEach((element, index) => {
        element.animate(
          [
            { opacity: 0, transform: "translateY(16px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 380, delay: 420 + index * 70, easing: EASE_OUT, fill: "both" },
        );
      });
    }

    return () => {
      for (const child of inerted) child.removeAttribute("inert");
      html.style.overflow = previous.overflow;
      html.style.paddingRight = previous.paddingRight;
      // `globals.css` pone `scroll-behavior: smooth`: la vuelta es instantánea.
      window.scrollTo({ top: scrollY, behavior: "instant" });
    };
    // Solo al montar: `from` es la foto del momento del click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resize (rotar el celular, achicar la ventana): la barra del hero cambia
  // de ancho y la de acá la sigue.
  useEffect(() => {
    function onResize() {
      const rect = getOriginRect();
      if (rect) setWidth(rect.width);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [getOriginRect]);

  /**
   * Salida: la entrada al revés (la barra baja a su lugar en el hero). Si la
   * barra ya no se ve (la persona scrolleó la confirmación con el bloque de
   * la app), un fundido de toda la capa: volar desde fuera de pantalla no
   * se entiende.
   */
  const leave = useCallback(
    (done: () => void) => {
      if (closingRef.current) return;
      closingRef.current = true;
      const root = rootRef.current;
      if (!root || prefersReducedMotion()) {
        done();
        return;
      }
      root.getAnimations({ subtree: true }).forEach((animation) => animation.finish());
      const animations: Animation[] = [];
      const barVisible = (barRef.current?.getBoundingClientRect().bottom ?? 0) > 0;

      if (!barVisible) {
        animations.push(
          root.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 300,
            easing: "ease-in",
            fill: "forwards",
          }),
        );
      } else {
        root.querySelectorAll<HTMLElement>("[data-stagger], [data-success]").forEach((element) => {
          animations.push(
            element.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" }),
          );
        });
        const closeButton = closeRef.current;
        if (closeButton) {
          animations.push(
            closeButton.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" }),
          );
        }
        const bar = barRef.current;
        const target = getOriginRect();
        if (bar && target) {
          const current = bar.getBoundingClientRect();
          animations.push(
            bar.animate(
              [
                { transform: "none" },
                {
                  transform: `translate(${target.left - current.left}px, ${target.top - current.top}px)`,
                },
              ],
              { duration: 460, delay: 80, easing: EASE_OUT, fill: "forwards" },
            ),
          );
        }
        if (bgRef.current) {
          animations.push(
            bgRef.current.animate([{ opacity: 1 }, { opacity: 0 }], {
              duration: 300,
              delay: 260,
              easing: "ease-in",
              fill: "forwards",
            }),
          );
        }
      }
      Promise.all(animations.map((animation) => animation.finished)).then(done, done);
    },
    [getOriginRect],
  );

  const close = useCallback(
    (reason: "close" | "change") => {
      if (submitting) return;
      const finalReason: RequestFlowCloseReason = succeededRef.current ? "done" : reason;
      leave(() => onClosed(finalReason));
    },
    [leave, onClosed, submitting],
  );

  // Confirmación en pantalla: arriba de todo, foco al título (que se lee
  // dentro de un `role="status"`) y entrada escalonada.
  useLayoutEffect(() => {
    if (phase !== "sent") return;
    const root = rootRef.current;
    if (root) root.scrollTop = 0;
    successHeadingRef.current?.focus({ preventScroll: true });
    onSuccessShown();
    if (prefersReducedMotion()) return;
    root?.querySelectorAll<HTMLElement>("[data-success]").forEach((element, index) => {
      element.animate(
        [
          { opacity: 0, transform: "translateY(16px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 380, delay: index * 80, easing: EASE_OUT, fill: "both" },
      );
    });
    // Solo al pasar a la confirmación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /** Los campos salen escalonados (hacia arriba) y entra la confirmación. */
  function showSuccess() {
    succeededRef.current = true;
    const form = formRef.current;
    if (!form || prefersReducedMotion()) {
      setPhase("sent");
      return;
    }
    form.getAnimations({ subtree: true }).forEach((animation) => animation.finish());
    const animations = Array.from(form.querySelectorAll<HTMLElement>("[data-stagger]")).map(
      (element, index) =>
        element.animate(
          [
            { opacity: 1, transform: "none" },
            { opacity: 0, transform: "translateY(-12px)" },
          ],
          { duration: 220, delay: index * 40, easing: "ease-in", fill: "forwards" },
        ),
    );
    Promise.all(animations.map((animation) => animation.finished)).then(
      () => setPhase("sent"),
      () => setPhase("sent"),
    );
  }

  // Esc cierra, como el resto de las superficies que tapan la página.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close("close");
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  function onMileageChange(raw: string) {
    const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    // Pasado el tope del backend, el tecleo no entra.
    if (digits && Number(digits) > MILEAGE_MAX_KM) return;
    setMileage(digits);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || closingRef.current || succeededRef.current) return;
    setDateAttempted(true);
    if (dateError) {
      dateRef.current?.focus();
      return;
    }
    const details: QuoteDetails = {
      timing,
      ...(timing === QUOTE_TIMINGS.date ? { preferredDate } : {}),
      partsSupply,
      ...(mileage ? { mileageKm: Number(mileage) } : {}),
    };
    const result = await onSubmit(details);
    if (result.ok) {
      showSuccess();
      return;
    }
    if (result.invalid) fieldRefs[result.invalid].current?.focus();
  }

  const { errors, plateCheck } = contact;
  // Estado del lookup, solo si es de la patente que está escrita ahora.
  const plateNow =
    plateCheck.kind !== "idle" && plateCheck.plate === contact.patente ? plateCheck : null;
  const plateStatus: FieldStatus = errors.patente
    ? "invalid"
    : plateNow?.kind === "validating"
      ? "validating"
      : plateNow?.kind === "valid"
        ? "valid"
        : plateNow?.kind === "unverified"
          ? "notice"
          : "idle";
  const describedBy = (...list: (string | false | null | undefined)[]) =>
    list.filter(Boolean).join(" ") || undefined;
  const label = "text-label font-semibold text-fg";
  const cell = "flex min-w-0 flex-col md:justify-center";
  const summaryValue = "truncate text-base text-fg";

  return (
    <div ref={rootRef} className="fixed inset-0 z-60 overflow-y-auto overscroll-contain text-left">
      {/* La "página limpia": solo fondo, sin tarjeta ni backdrop. */}
      <div ref={bgRef} aria-hidden="true" className="fixed inset-0 bg-card" />

      <button
        ref={closeRef}
        type="button"
        onClick={() => close("close")}
        disabled={submitting}
        aria-label={copy.close}
        className="fixed top-3 right-3 z-10 flex size-11 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-card-muted hover:text-fg disabled:opacity-50 motion-reduce:transition-none md:top-5 md:right-5"
      >
        {/* El set de `Icon` no tiene "cerrar". */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <div
        className="relative mx-auto w-full px-4 pt-17 pb-12 md:pt-20"
        // Ancho de la barra del hero (+ el gutter de 16px por lado).
        style={{ maxWidth: width + 32 }}
      >
        {/* Barra resumen: la misma forma que la del hero, sin inputs ni
            submit. "Cambiar" vuelve al hero con el foco en "¿Qué le pasa?". */}
        <div
          ref={barRef}
          className="flex flex-col overflow-hidden rounded-panel border border-control-line-strong bg-card md:h-18 md:flex-row md:items-center md:overflow-visible md:rounded-full md:pr-2"
        >
          <p className="sr-only">{copy.summaryLabel}</p>
          {/* `ph-no-capture`: lo que escribió la persona, fuera de un input,
              queda fuera de la grabación de sesiones. */}
          <dl className="ph-no-capture flex min-w-0 flex-1 flex-col md:flex-row md:self-stretch">
            <div className={cn(cell, "border-b border-card-line px-4.5 pt-3 pb-2.5 md:flex-8 md:border-b-0 md:py-0 md:pr-4 md:pl-7")}>
              <dt className="text-xs font-semibold text-fg">{barLabels.problema}</dt>
              <dd className={summaryValue}>{problema}</dd>
            </div>
            <span aria-hidden="true" className="hidden h-9 w-px shrink-0 self-center bg-control-line md:block" />
            <div className={cn(cell, "px-4.5 pt-3 pb-2.5 md:flex-5 md:py-0 md:pr-4 md:pl-6")}>
              <dt className="text-xs font-semibold text-fg">{barLabels.zona}</dt>
              <dd className={summaryValue}>{zona}</dd>
            </div>
          </dl>
          <Button
            type="button"
            variant="outline"
            size="56"
            onClick={() => close("change")}
            disabled={submitting}
            // Enviado, ya no hay qué cambiar: `invisible` (no se ve ni se
            // enfoca) y no `hidden`, para que la barra no cambie de forma.
            className={cn(
              "mx-2 mb-2 h-13 shrink-0 rounded-card md:m-0 md:h-14 md:rounded-full",
              phase === "sent" && "invisible",
            )}
          >
            {copy.change}
          </Button>
        </div>

        {phase === "sent" ? (
          <div ref={successRef} className="mt-7 flex flex-col gap-7">
            {/* La confirmación es la región de estado; el foco va a su título. */}
            <div data-success className="flex flex-col items-start gap-5">
              <div role="status" className="flex flex-col items-start gap-4">
                {sentIcon}
                <div>
                  <h2
                    id={ids.success}
                    ref={successHeadingRef}
                    tabIndex={-1}
                    className="font-display text-2xl leading-tight font-bold text-fg outline-none md:text-3xl"
                  >
                    {copy.success.title}
                  </h2>
                  <p className="mt-2 text-base text-fg-muted">
                    {/* Solo el código real que devolvió el envío; sin él, no va. */}
                    {publicCode ? (
                      <>
                        {sentCopy.code.before}
                        <strong className="font-semibold text-fg tabular-nums">
                          {sentCopy.code.prefix}
                          {publicCode}
                        </strong>
                        {sentCopy.code.after}
                      </>
                    ) : null}
                    {sentCopy.body}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="primary"
                size="56"
                onClick={() => close("close")}
                className="max-md:w-full"
              >
                {copy.success.back}
              </Button>
            </div>
            {/* `overflow-clip` (PRODUCT.md): recorta las esquinas del bloque
                de la app sin crear un contenedor de scroll. */}
            <div data-success className="overflow-clip rounded-panel border border-control-line">
              {appPromo}
            </div>
          </div>
        ) : (
          <form
            ref={formRef}
            noValidate
            onSubmit={submit}
            aria-labelledby={ids.heading}
            className="mt-7 flex flex-col gap-7"
          >
            <div data-stagger>
              <h2
                id={ids.heading}
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-xl font-bold text-fg outline-none md:text-2xl"
              >
                {copy.title}
              </h2>
              <p className="mt-1 text-base text-fg-muted">{copy.subtitle}</p>
            </div>

            {/* ¿Para cuándo? */}
            <fieldset data-stagger className="min-w-0">
              <legend className={cn(label, "mb-2.5")}>{copy.timing.legend}</legend>
              <div className="flex flex-wrap gap-2">
                {copy.timing.options.map((option) => {
                  const checked = timing === option.id;
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        chipVariants({ selected: checked, interactive: true, size: "44" }),
                        "cursor-pointer outline-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2",
                      )}
                    >
                      <input
                        type="radio"
                        name={ids.timing}
                        value={option.id}
                        checked={checked}
                        onChange={() => setTiming(option.id)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
              {timing === QUOTE_TIMINGS.date ? (
                <div className="mt-4 flex max-w-80 flex-col gap-1.5">
                  <label htmlFor={ids.date} className={label}>
                    {copy.timing.date.label}
                  </label>
                  <input
                    id={ids.date}
                    ref={dateRef}
                    type="date"
                    required
                    min={today}
                    value={preferredDate}
                    onChange={(event) => setPreferredDate(event.target.value)}
                    aria-invalid={visibleDateError ? true : undefined}
                    aria-describedby={visibleDateError ? `${ids.date}-error` : undefined}
                    className={pillInputVariants({ size: "56" })}
                  />
                  {visibleDateError ? (
                    <p id={`${ids.date}-error`} className="px-5 text-label font-medium text-status-alert">
                      {visibleDateError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </fieldset>

            {/* ¿Y los repuestos? */}
            <fieldset data-stagger className="min-w-0" aria-describedby={`${ids.parts}-sub`}>
              <legend className={label}>{copy.parts.legend}</legend>
              <p id={`${ids.parts}-sub`} className="mt-0.5 mb-2.5 text-label text-fg-muted">
                {copy.parts.subtitle}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {copy.parts.options.map((option) => {
                  const checked = partsSupply === option.id;
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "flex min-h-11 cursor-pointer flex-col gap-0.5 rounded-card border px-4 py-3 transition-colors motion-reduce:transition-none",
                        "outline-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2",
                        checked ? "border-action bg-brand-50" : "border-control-line bg-card hover:border-fg-subtle",
                      )}
                    >
                      <input
                        type="radio"
                        name={ids.parts}
                        value={option.id}
                        checked={checked}
                        onChange={() => setPartsSupply(option.id)}
                        className="sr-only"
                      />
                      <span className="text-control font-semibold text-fg">{option.label}</span>
                      <span className="text-label text-fg-muted">{option.detail}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div data-stagger className="grid gap-5 md:grid-cols-2">
              {/* Kilometraje: entero, con separador de miles de es-AR. */}
              <div className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor={ids.mileage} className={label}>
                  {copy.mileage.label} <span className="font-normal text-fg-muted">{copy.mileage.optional}</span>
                </label>
                <div className="relative">
                  <input
                    id={ids.mileage}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={mileage ? Number(mileage).toLocaleString("es-AR") : ""}
                    onChange={(event) => onMileageChange(event.target.value)}
                    placeholder={copy.mileage.placeholder}
                    aria-describedby={`${ids.mileage}-suffix`}
                    className={cn(pillInputVariants({ size: "56" }), "pr-14 tabular-nums")}
                  />
                  <span
                    id={`${ids.mileage}-suffix`}
                    className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-base text-fg-muted"
                  >
                    {copy.mileage.suffix}
                  </span>
                </div>
              </div>

              {/* Patente: opcional pero recomendada; al salir del campo se
                  valida en clasific.ar (lo dispara `ModuloForm`, nunca bloquea). */}
              <div className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor={ids.patente} className={label}>
                  {contactCopy.patente.label}{" "}
                  <span className="font-normal text-fg-muted">{contactCopy.patente.optional}</span>
                </label>
                <div className="relative">
                  <input
                    id={ids.patente}
                    ref={fieldRefs.patente}
                    type="text"
                    value={contact.patente}
                    onChange={(event) => contact.onPatenteChange(normalizePlateInput(event.target.value))}
                    onBlur={contact.onPatenteBlur}
                    placeholder={contactCopy.patente.placeholder}
                    maxLength={9}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-invalid={errors.patente ? true : undefined}
                    aria-busy={plateStatus === "validating" || undefined}
                    aria-describedby={describedBy(
                      `${ids.patente}-hint`,
                      `${ids.patente}-status`,
                      errors.patente && `${ids.patente}-error`,
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
                {/* Siempre en el DOM: "Validando…" y "Patente validada" solo se
                    leen (el ícono ya lo muestra); "No pudimos validarla…" también se ve. */}
                <p
                  id={`${ids.patente}-status`}
                  aria-live="polite"
                  className={cn(plateNow?.kind === "unverified" ? "px-5 text-label text-fg-muted" : "sr-only")}
                >
                  {plateNow ? contactCopy.patente.status[plateNow.kind] : null}
                </p>
                <p id={`${ids.patente}-hint`} className="px-5 text-label text-fg-muted">
                  {contactCopy.patente.hint}
                </p>
              </div>
            </div>

            {/* WhatsApp: el mismo control que el paso de `/pedido` (+54 fijo). */}
            <div data-stagger className="flex flex-col gap-1.5">
              <label htmlFor={ids.whatsapp} className={label}>
                {copy.phone.label}
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
                  <span aria-hidden="true">{contactCopy.whatsapp.prefix}</span>
                  <span className="sr-only">{contactCopy.whatsapp.prefixLabel}</span>
                </span>
                <WhatsappInput
                  id={ids.whatsapp}
                  ref={fieldRefs.whatsapp}
                  autoComplete="tel-national"
                  required
                  value={contact.whatsapp}
                  onValueChange={contact.onWhatsappChange}
                  onBlur={contact.onWhatsappBlur}
                  placeholder={contactCopy.whatsapp.placeholder}
                  aria-invalid={errors.whatsapp ? true : undefined}
                  aria-describedby={describedBy(
                    `${ids.whatsapp}-prefix`,
                    `${ids.whatsapp}-hint`,
                    errors.whatsapp && `${ids.whatsapp}-error`,
                  )}
                  className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent py-0 pl-3 text-base text-fg placeholder:text-fg-subtle"
                />
              </div>
              <p id={`${ids.whatsapp}-hint`} className="px-5 text-label text-fg-muted">
                {copy.phone.hint}
              </p>
              {errors.whatsapp ? (
                <p id={`${ids.whatsapp}-error`} className="px-5 text-label font-medium text-status-alert">
                  {errors.whatsapp}
                </p>
              ) : null}
            </div>

            {/* Consentimiento: el mismo del paso de `/pedido` (checkbox nativo
                desmarcado y obligatorio; todo el renglón es el label). */}
            <div data-stagger className="flex flex-col gap-1">
              <label
                htmlFor={ids.consent}
                className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm text-fg-muted"
              >
                <input
                  id={ids.consent}
                  ref={fieldRefs.consent}
                  type="checkbox"
                  checked={contact.consent}
                  onChange={(event) => contact.onConsentChange(event.target.checked)}
                  required
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={errors.consent ? `${ids.consent}-error` : undefined}
                  className="mt-0.5 size-5 shrink-0 cursor-pointer accent-action"
                />
                <span>
                  {contactCopy.consent.prefix}
                  {consentLinks.terms}
                  {contactCopy.consent.middle}
                  {consentLinks.privacy}
                  {contactCopy.consent.suffix}
                </span>
              </label>
              {errors.consent ? (
                <p id={`${ids.consent}-error`} className="pl-8 text-label font-medium text-status-alert">
                  {errors.consent}
                </p>
              ) : null}
            </div>

            {/* Siempre en el DOM (vacía en reposo) para que el error se anuncie. */}
            <div aria-live="assertive">
              {errorMessage ? (
                <p className="text-sm font-medium text-status-alert">{errorMessage}</p>
              ) : null}
            </div>

            <div data-stagger className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-label text-fg-muted">{contactCopy.note}</p>
              <Button
                type="submit"
                variant="primary"
                size="56"
                className="max-md:w-full md:shrink-0"
                disabled={submitting}
                aria-busy={submitting || undefined}
              >
                {submitting ? contactCopy.submitting : contactCopy.submit}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
