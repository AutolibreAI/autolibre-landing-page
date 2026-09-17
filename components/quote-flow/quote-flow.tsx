"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { FormError } from "@/components/ui/form-feedback";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { cn } from "@/lib/utils";
import { PlateField } from "./plate-field";
import { QuoteProgress } from "./quote-progress";
import { QuoteSuccess } from "./quote-success";
import {
  GOOGLE_MAPS_API_KEY,
  useQuoteFlow,
  whatsappDigitCount,
  type QuoteFlowAttribution,
} from "./use-quote-flow";

const copy = presupuestoContent.modal;

type QuoteFlowLayout = "modal" | "page";

type QuoteFlowProps = {
  /** Qué chrome lo envuelve. No cambia una sola regla del flujo, solo su escala. */
  readonly layout: QuoteFlowLayout;
  readonly onClose?: () => void;
  readonly attribution?: QuoteFlowAttribution;
};

/**
 * El flujo de pedido completo, sin chrome: los 4 pasos, el progreso y la
 * confirmación. Vive igual dentro del modal de la home que dentro de
 * `/pedido`; lo único que cambia entre los dos es la escala de la tipografía
 * y dónde se apoya el CTA.
 */
export function QuoteFlow({ layout, onClose, attribution }: QuoteFlowProps) {
  const flow = useQuoteFlow({ attribution });
  const {
    step,
    totalSteps,
    plate,
    lookup,
    whatsapp,
    address,
    addressTouched,
    email,
    description,
    consent,
    submitState,
    addressInputRef,
    canSearchPlate,
    emailValid,
    addressValid,
    canContinueFromContact,
    canContinueFromNeed,
  } = flow;

  const isPage = layout === "page";
  const isSuccess = submitState.kind === "success";
  const headingRef = useRef<HTMLElement>(null);

  // Cambiar de paso reemplaza todo el contenido: sin mover el foco, un lector
  // de pantalla se queda leyendo un formulario que ya no existe. En el modal
  // el destino es el propio diálogo (era lo que hacía antes); en la página no
  // hay diálogo, así que es el título del paso.
  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;
    if (isPage) {
      heading.focus();
      return;
    }
    heading.closest<HTMLElement>('[role="dialog"]')?.focus();
  }, [step, isPage]);

  return (
    <>
      {GOOGLE_MAPS_API_KEY ? (
        <Script
          id="google-maps-places"
          src={`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places&language=es&region=AR`}
          strategy="afterInteractive"
          onReady={flow.markMapsReady}
        />
      ) : null}

      {isSuccess ? (
        <QuoteSuccess variant={layout} onClose={onClose} />
      ) : (
        <>
          <QuoteProgress step={step} total={totalSteps} layout={layout} />

          <div className={cn(isPage && "pb-28 lg:pb-0")}>
            {step === 1 ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (
                    canSearchPlate &&
                    lookup.kind !== "loading" &&
                    lookup.kind !== "searching"
                  ) {
                    flow.searchPlate();
                  }
                }}
              >
                <StepHeading layout={layout} headingRef={headingRef}>
                  {copy.steps.plate.heading}
                </StepHeading>

                <PlateField
                  layout={layout}
                  value={plate}
                  onChange={flow.setPlate}
                  lookup={lookup}
                  canSearchPlate={canSearchPlate}
                  onConfirm={flow.confirmVehicle}
                  onReject={flow.rejectVehicle}
                  onContinueAnyway={flow.continueAnyway}
                />

                {lookup.kind === "idle" ||
                lookup.kind === "loading" ||
                lookup.kind === "searching" ? (
                  <>
                    {/* En la página el aviso va ARRIBA del CTA: abajo quedaría
                        tapado por la banda fija. */}
                    {isPage && lookup.kind === "searching" ? (
                      <p className="mt-4 text-xs text-ink/65">
                        {copy.steps.plate.stillSearchingHint}
                      </p>
                    ) : null}

                    <PlateCta isPage={isPage}>
                      <Button
                        type="submit"
                        block
                        className={isPage ? undefined : "mt-4"}
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
                    </PlateCta>

                    {!isPage && lookup.kind === "searching" ? (
                      <p className="mt-3 text-xs text-ink/65">
                        {copy.steps.plate.stillSearchingHint}
                      </p>
                    ) : null}
                  </>
                ) : null}
              </form>
            ) : null}

            {step === 2 ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (canContinueFromContact) flow.goNext();
                }}
              >
                <StepHeading layout={layout} headingRef={headingRef}>
                  {copy.steps.contact.heading}
                </StepHeading>

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
                      onChange={(event) => flow.setWhatsapp(event.target.value)}
                      placeholder={copy.steps.contact.whatsappPlaceholder}
                      autoComplete="tel"
                      autoFocus={!isPage}
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
                      onChange={(event) => flow.setAddress(event.target.value)}
                      onBlur={flow.markAddressTouched}
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
                      onChange={(event) => flow.setEmail(event.target.value)}
                      placeholder={copy.steps.contact.emailPlaceholder}
                      autoComplete="email"
                    />
                  </Field>
                </div>

                <StepNav
                  layout={layout}
                  onBack={flow.goBack}
                  disabled={!canContinueFromContact}
                />
              </form>
            ) : null}

            {step === 3 ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (canContinueFromNeed) flow.goNext();
                }}
              >
                <StepHeading layout={layout} headingRef={headingRef}>
                  {copy.steps.need.heading}
                </StepHeading>

                <Field
                  label="Necesidad"
                  htmlFor="quote-need"
                  required
                  hint={copy.steps.need.hint}
                >
                  <Textarea
                    id="quote-need"
                    value={description}
                    onChange={(event) => flow.setDescription(event.target.value)}
                    placeholder={copy.steps.need.placeholder}
                    rows={isPage ? 6 : 4}
                    autoFocus={!isPage}
                  />
                </Field>

                <StepNav
                  layout={layout}
                  onBack={flow.goBack}
                  disabled={!canContinueFromNeed}
                />
              </form>
            ) : null}

            {step === 4 ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (consent && submitState.kind !== "loading") flow.submit();
                }}
              >
                <StepHeading layout={layout} headingRef={headingRef}>
                  {copy.steps.consent.heading}
                </StepHeading>

                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-card border border-line bg-surface-subtle",
                    isPage ? "p-5" : "p-4",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => flow.setConsent(event.target.checked)}
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

                <StepFooter layout={layout}>
                  <BackButton onClick={flow.goBack} />
                  <Button
                    type="submit"
                    block
                    disabled={!consent || submitState.kind === "loading"}
                  >
                    {submitState.kind === "loading"
                      ? copy.submitLoadingLabel
                      : copy.submitLabel}
                  </Button>
                </StepFooter>
              </form>
            ) : null}
          </div>
        </>
      )}
    </>
  );
}

/**
 * En la página el título del paso es el encabezado real de la vista (y el
 * destino del foco); en el modal ese rol ya lo cumple el header del diálogo,
 * así que sigue siendo un párrafo.
 */
function StepHeading({
  layout,
  headingRef,
  children,
}: {
  readonly layout: QuoteFlowLayout;
  readonly headingRef: React.RefObject<HTMLElement | null>;
  readonly children: React.ReactNode;
}) {
  if (layout === "page") {
    return (
      <h2
        ref={headingRef as React.RefObject<HTMLHeadingElement | null>}
        tabIndex={-1}
        className="mb-5 font-display text-[1.5rem] font-bold text-ink outline-none sm:text-[1.75rem]"
      >
        {children}
      </h2>
    );
  }

  return (
    <p
      ref={headingRef as React.RefObject<HTMLParagraphElement | null>}
      className="mb-4 font-display text-base font-semibold text-ink"
    >
      {children}
    </p>
  );
}

/**
 * En mobile la página es larga y el CTA no puede quedar debajo del pliegue:
 * se apoya en una banda fija al pie. En desktop (y siempre en el modal) vuelve
 * a ser un bloque más del flujo.
 */
function StepFooter({
  layout,
  children,
}: {
  readonly layout: QuoteFlowLayout;
  readonly children: React.ReactNode;
}) {
  if (layout === "page") {
    return (
      <div className="sticky bottom-0 -mx-5 mt-8 border-t border-line bg-surface/95 px-5 pt-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] backdrop-blur-md lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pt-0 lg:pb-0 lg:backdrop-blur-none">
        <div className="flex items-center gap-3">{children}</div>
      </div>
    );
  }

  return <div className="mt-5 flex items-center gap-3">{children}</div>;
}

/**
 * El paso 1 no tiene "Atrás", así que su CTA no pasa por `StepFooter`: en el
 * modal es el botón suelto de siempre, sin la fila que envuelve a los otros.
 */
function PlateCta({
  isPage,
  children,
}: {
  readonly isPage: boolean;
  readonly children: React.ReactNode;
}) {
  if (!isPage) return <>{children}</>;
  return <StepFooter layout="page">{children}</StepFooter>;
}

function BackButton({ onClick }: { readonly onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-semibold text-ink/65 hover:text-ink"
    >
      {copy.back}
    </button>
  );
}

function StepNav({
  layout,
  onBack,
  disabled,
}: {
  readonly layout: QuoteFlowLayout;
  readonly onBack: () => void;
  readonly disabled: boolean;
}) {
  return (
    <StepFooter layout={layout}>
      <BackButton onClick={onBack} />
      <Button type="submit" block disabled={disabled}>
        {copy.continue}
      </Button>
    </StepFooter>
  );
}
