"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Script from "next/script";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { FormError } from "@/components/ui/form-feedback";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { EMAIL_REGEX } from "@/lib/validation";
import { siteConfig } from "@/lib/seo/config";
import type { VariantProps } from "class-variance-authority";

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GooglePlaceResult = {
  formatted_address?: string;
  name?: string;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
  address_components?: GoogleAddressComponent[];
};

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: Record<string, unknown>,
          ) => {
            addListener: (
              eventName: string,
              callback: () => void,
            ) => { remove: () => void };
            getPlace: () => GooglePlaceResult;
          };
        };
      };
    };
  }
}

/**
 * Sin key no hay Autocomplete: el campo de direccion sigue funcionando como
 * texto libre (ver `mapsReady`), solo que sin el picker de Google Places.
 */
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Lo que sale de elegir una sugerencia del Autocomplete: un geocode real, con
 * la misma confiabilidad que el GPS del telefono. Si el usuario escribe a
 * mano sin elegir ninguna, esto queda vacio y el pedido viaja como `typed`
 * (ver `handleSubmit`) — nunca se manda una coordenada que no vino de Google.
 */
type PlaceGeo = {
  latitude: number | null;
  longitude: number | null;
  locality: string | null;
  province: string | null;
};

const EMPTY_GEO: PlaceGeo = {
  latitude: null,
  longitude: null,
  locality: null,
  province: null,
};

/** `long_name` del primer address_component cuyo `types` incluya `type`. */
function findAddressComponent(
  components: GoogleAddressComponent[] | undefined,
  type: string,
): string | null {
  return components?.find((component) => component.types.includes(type))?.long_name ?? null;
}

const PLATE_PATTERNS: readonly RegExp[] = [
  /^[A-Z]{3}\d{3}$/, // auto legacy   - ABC123
  /^[A-Z]{2}\d{3}[A-Z]{2}$/, // auto Mercosur - AB123CD
  /^\d{3}[A-Z]{3}$/, // moto legacy   - 123ABC
  /^[A-Z]\d{3}[A-Z]{3}$/, // moto Mercosur - A123BCD
];

function isValidPlate(value: string): boolean {
  return PLATE_PATTERNS.some((pattern) => pattern.test(value));
}

function normalizePlateInput(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

function whatsappDigitCount(raw: string): number {
  return raw.replace(/\D/g, "").length;
}

/**
 * `siteConfig.contact.whatsapp` es el link genérico del sitio (footer, FAQ) y
 * su texto precargado es de otro contexto ("Me interesa comprar un
 * escáner!") — no sirve para el fallback del modal de presupuesto. Se arma
 * un link propio con el mismo número pero un mensaje que tiene sentido acá.
 * wa.me solo acepta dígitos: sin `+`, sin espacios y sin guiones.
 */
const PRESUPUESTO_WHATSAPP_TEXT = "¡Hola! Hice un pedido de presupuesto en la web de AutoLibre.";
const PRESUPUESTO_WHATSAPP_URL = `https://wa.me/${siteConfig.contact.phoneE164.replace(/\D/g, "")}?text=${encodeURIComponent(PRESUPUESTO_WHATSAPP_TEXT)}`;

const TOTAL_STEPS = 4;
const copy = presupuestoContent.modal;

type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "searching" }
  | { kind: "found"; brand: string; model: string; year: number | null }
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

type SubmitState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; id: string }
  | { kind: "error"; message: string };

type QuoteRequestModalProps = VariantProps<typeof buttonVariants> & {
  readonly children: React.ReactNode;
  readonly className?: string;
};

export function QuoteRequestModal({
  children,
  className,
  variant,
  size,
}: QuoteRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [plate, setPlate] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ kind: "idle" });
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [addressTouched, setAddressTouched] = useState(false);
  const [geo, setGeo] = useState<PlaceGeo>(EMPTY_GEO);
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });
  const [mapsReady, setMapsReady] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // `overflow: hidden` solo frena el scroll con scrollbar: en iOS Safari el
  // arrastre tactil sigue moviendo (y "rebotando") el body por debajo, en
  // vertical Y horizontal, aunque el modal este encima. Fijar el body con
  // `position: fixed` le saca al dedo algo para arrastrar. `top` negativo
  // compensa el scroll ya hecho para que no salte al abrir, y se restaura al
  // cerrar.
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      // rAF y no sincronico: el body recien salio de `position: fixed` (que
      // lo achicaba al alto del viewport) y el navegador todavia no
      // recalculo cuanto mide el documento. Un `scrollTo` inmediato corre
      // contra ese layout viejo y el salto de vuelta queda clampeado a 0.
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open, step]);

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
      fields: ["formatted_address", "name", "geometry", "address_components"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const value = place.formatted_address ?? place.name;
      if (!value) return;

      setAddress(value);
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

  // Ningun timeout de polling puede seguir vivo despues de que el modal se
  // desmonta (o se cierra sin pasar por `close()`, ej. navegacion).
  useEffect(() => clearLookupPoll, []);

  function reset() {
    clearLookupPoll();
    setStep(1);
    setPlate("");
    setLookup({ kind: "idle" });
    setWhatsapp("");
    setAddress("");
    setAddressTouched(false);
    setGeo(EMPTY_GEO);
    setEmail("");
    setDescription("");
    setConsent(false);
    setSubmitState({ kind: "idle" });
  }

  function close() {
    setOpen(false);
    reset();
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
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? copy.genericError);
      setSubmitState({ kind: "success", id: data.id });
    } catch (error) {
      setSubmitState({
        kind: "error",
        message: error instanceof Error && error.message ? error.message : copy.genericError,
      });
    }
  }

  const canSearchPlate = isValidPlate(plate);
  const emailValid = email === "" || EMAIL_REGEX.test(email);
  const addressValid = address.trim().length > 0;
  const canContinueFromContact =
    whatsappDigitCount(whatsapp) >= 8 && emailValid && addressValid;
  const canContinueFromNeed = description.trim().length > 0;


  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>

      {open && GOOGLE_MAPS_API_KEY ? (
        <Script
          id="google-maps-places"
          src={`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places&language=es&region=AR`}
          strategy="afterInteractive"
          onReady={() => setMapsReady(true)}
        />
      ) : null}

      {open
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <div
                className="absolute inset-0 bg-ink/50"
                onClick={close}
                aria-hidden="true"
              />

              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={copy.title}
                tabIndex={-1}
                className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[480px] flex-col overflow-hidden rounded-panel bg-surface shadow-[0_20px_50px_rgba(28,43,28,0.25)] outline-none"
              >
                <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
                  <div>
                    <p className="font-display text-base font-bold text-ink">
                      {copy.title}
                    </p>
                    {submitState.kind !== "success" ? (
                      <p className="mt-0.5 text-xs text-ink/55">
                        Paso {step} de {TOTAL_STEPS}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label="Cerrar"
                    onClick={close}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-surface-muted hover:text-ink"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <line x1="4" y1="4" x2="20" y2="20" />
                      <line x1="20" y1="4" x2="4" y2="20" />
                    </svg>
                  </button>
                </div>

                {submitState.kind !== "success" ? (
                  <div className="h-1 w-full bg-surface-muted">
                    <div
                      className="h-full bg-brand transition-all"
                      style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                    />
                  </div>
                ) : null}

                <div className="overflow-y-auto px-6 py-6">
                  {submitState.kind === "success" ? (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <span className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M4 12.5l5 5L20 6.5" />
                        </svg>
                      </span>
                      <p className="font-display text-lg font-bold text-ink">
                        {copy.success.title}
                      </p>
                      <p className="max-w-[34ch] text-sm leading-relaxed text-ink/65">
                        {copy.success.description}
                      </p>
                      <div className="mt-3 w-full border-t border-line pt-4">
                        <p className="text-xs text-ink/55">{copy.success.whatsappFallback}</p>
                        <a
                          href={PRESUPUESTO_WHATSAPP_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-sm font-semibold text-brand hover:text-brand-hover"
                        >
                          {copy.success.whatsappLinkLabel}
                        </a>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={close}>
                        {copy.success.closeLabel}
                      </Button>
                    </div>
                  ) : null}

                  {submitState.kind !== "success" && step === 1 ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (
                          canSearchPlate &&
                          lookup.kind !== "loading" &&
                          lookup.kind !== "searching"
                        ) {
                          runLookup();
                        }
                      }}
                    >
                      <p className="mb-4 font-display text-base font-semibold text-ink">
                        {copy.steps.plate.heading}
                      </p>
                      <Field
                        label="Patente"
                        htmlFor="quote-plate"
                        required
                        hint={
                          plate && !canSearchPlate
                            ? copy.steps.plate.invalidHint
                            : copy.steps.plate.hint
                        }
                      >
                        <Input
                          id="quote-plate"
                          value={plate}
                          onChange={(event) => {
                            clearLookupPoll();
                            setPlate(normalizePlateInput(event.target.value));
                            setLookup({ kind: "idle" });
                          }}
                          placeholder={copy.steps.plate.placeholder}
                          maxLength={7}
                          autoComplete="off"
                          autoFocus
                        />
                      </Field>

                      {lookup.kind === "idle" ||
                      lookup.kind === "loading" ||
                      lookup.kind === "searching" ? (
                        <>
                          <Button
                            type="submit"
                            block
                            className="mt-4"
                            disabled={
                              !canSearchPlate ||
                              lookup.kind === "loading" ||
                              lookup.kind === "searching"
                            }
                          >
                            {lookup.kind === "idle"
                              ? copy.steps.plate.searchLabel
                              : copy.steps.plate.searchingLabel}
                          </Button>
                          {lookup.kind === "searching" ? (
                            <p className="mt-3 text-xs text-ink/55">
                              {copy.steps.plate.stillSearchingHint}
                            </p>
                          ) : null}
                        </>
                      ) : null}

                      {lookup.kind === "found" ? (
                        <div className="mt-4 rounded-card border border-line bg-surface-subtle p-4">
                          <p className="text-xs text-ink/55">{copy.steps.plate.foundLabel}</p>
                          <p className="font-display text-base font-bold text-ink">
                            {lookup.brand} {lookup.model}
                            {lookup.year ? ` · ${lookup.year}` : ""}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button type="button" size="sm" onClick={() => setStep(2)}>
                              {copy.steps.plate.foundConfirm}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setLookup({ kind: "idle" })}
                            >
                              {copy.steps.plate.foundReject}
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      {lookup.kind === "not_found" || lookup.kind === "unavailable" ? (
                        <div className="mt-4 rounded-card border border-line bg-surface-subtle p-4">
                          <p className="text-sm text-ink/70">
                            {lookup.kind === "not_found"
                              ? copy.steps.plate.notFound
                              : copy.steps.plate.unavailable}
                          </p>
                          <Button type="button" size="sm" className="mt-3" onClick={() => setStep(2)}>
                            {copy.steps.plate.continueAnyway}
                          </Button>
                        </div>
                      ) : null}
                    </form>
                  ) : null}

                  {submitState.kind !== "success" && step === 2 ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (canContinueFromContact) setStep(3);
                      }}
                    >
                      <p className="mb-4 font-display text-base font-semibold text-ink">
                        {copy.steps.contact.heading}
                      </p>
                      <div className="flex flex-col gap-4">
                        <Field
                          label={copy.steps.contact.whatsappLabel}
                          htmlFor="quote-whatsapp"
                          required
                          hint={
                            whatsapp && whatsappDigitCount(whatsapp) < 8
                              ? copy.steps.contact.whatsappInvalid
                              : copy.steps.contact.whatsappHint
                          }
                        >
                          <Input
                            id="quote-whatsapp"
                            type="tel"
                            value={whatsapp}
                            onChange={(event) => setWhatsapp(event.target.value)}
                            placeholder={copy.steps.contact.whatsappPlaceholder}
                            autoComplete="tel"
                            autoFocus
                          />
                        </Field>
                        <Field
                          label={copy.steps.contact.addressLabel}
                          htmlFor="quote-address"
                          required
                          hint={
                            addressTouched && !addressValid
                              ? copy.steps.contact.addressInvalid
                              : copy.steps.contact.addressHint
                          }
                        >
                          <Input
                            id="quote-address"
                            ref={addressInputRef}
                            value={address}
                            onChange={(event) => {
                              setAddress(event.target.value);
                              // Editar a mano invalida el geocode anterior:
                              // sin esto, tocar la direccion elegida (agregar
                              // un depto, por ej.) mandaria coordenadas que ya
                              // no corresponden a lo que se ve en el input.
                              setGeo(EMPTY_GEO);
                            }}
                            onBlur={() => setAddressTouched(true)}
                            placeholder={copy.steps.contact.addressPlaceholder}
                            autoComplete="off"
                          />
                        </Field>
                        <Field
                          label={copy.steps.contact.emailLabel}
                          htmlFor="quote-email"
                          hint={!emailValid ? copy.steps.contact.emailInvalid : undefined}
                        >
                          <Input
                            id="quote-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder={copy.steps.contact.emailPlaceholder}
                            autoComplete="email"
                          />
                        </Field>
                      </div>
                      <StepNav
                        onBack={() => setStep(1)}
                        disabled={!canContinueFromContact}
                      />
                    </form>
                  ) : null}

                  {submitState.kind !== "success" && step === 3 ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (canContinueFromNeed) setStep(4);
                      }}
                    >
                      <p className="mb-4 font-display text-base font-semibold text-ink">
                        {copy.steps.need.heading}
                      </p>
                      <Field
                        label="Necesidad"
                        htmlFor="quote-need"
                        required
                        hint={copy.steps.need.hint}
                      >
                        <Textarea
                          id="quote-need"
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                          placeholder={copy.steps.need.placeholder}
                          rows={4}
                          autoFocus
                        />
                      </Field>
                      <StepNav onBack={() => setStep(2)} disabled={!canContinueFromNeed} />
                    </form>
                  ) : null}

                  {submitState.kind !== "success" && step === 4 ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (consent && submitState.kind !== "loading") handleSubmit();
                      }}
                    >
                      <p className="mb-4 font-display text-base font-semibold text-ink">
                        {copy.steps.consent.heading}
                      </p>
                      <label className="flex cursor-pointer items-start gap-3 rounded-card border border-line bg-surface-subtle p-4">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(event) => setConsent(event.target.checked)}
                          className="mt-0.5 size-4 shrink-0 accent-brand"
                        />
                        <span className="text-sm leading-relaxed text-ink/80">
                          {copy.steps.consent.prefix}
                          <Link
                            href="/privacidad"
                            target="_blank"
                            className="font-semibold text-brand hover:text-brand-hover"
                          >
                            {copy.steps.consent.privacyLinkLabel}
                          </Link>
                          {copy.steps.consent.suffix}
                        </span>
                      </label>

                      {submitState.kind === "error" ? (
                        <div className="mt-3">
                          <FormError message={submitState.message} />
                        </div>
                      ) : null}

                      <div className="mt-5 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className="text-sm font-semibold text-ink/60 hover:text-ink"
                        >
                          {copy.back}
                        </button>
                        <Button
                          type="submit"
                          block
                          disabled={!consent || submitState.kind === "loading"}
                        >
                          {submitState.kind === "loading" ? copy.submitLoadingLabel : copy.submitLabel}
                        </Button>
                      </div>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function StepNav({
  onBack,
  disabled,
}: {
  readonly onBack: () => void;
  readonly disabled: boolean;
}) {
  return (
    <div className="mt-5 flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-ink/60 hover:text-ink"
      >
        {copy.back}
      </button>
      <Button type="submit" block disabled={disabled}>
        {copy.continue}
      </Button>
    </div>
  );
}
