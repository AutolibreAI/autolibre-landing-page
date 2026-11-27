import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { providersPlansContent } from "@/lib/content/providers-plans";
import { siteContent } from "@/lib/content/site";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

/**
 * Tarjetas de precios de `/proveedores/planes` (lienzo `Planes`): nombre,
 * bajada, precio y botón, y recién después cómo funciona. Son el primer
 * trabajo (gratis), el trabajo suelto y el pack de 3 trabajos (modelo por
 * trabajo confirmado, 2026-11-26). Debajo, la consulta a ventas por WhatsApp.
 *
 * Outline: un `h2` (solo para lectores) para la grilla y un `h3` por tarjeta.
 * Ninguna tarjeta lleva a la contratación (`/proveedores/contratar`) ni
 * dispara `plan_checkout_started`: van al registro o a WhatsApp.
 */
export function ProvidersPlansGrid() {
  const { plans, sales, gridTitle } = providersPlansContent;

  return (
    <div className="flex flex-col gap-4">
      <h2 id="planes-grilla" className="sr-only">
        {gridTitle}
      </h2>
      <ul aria-labelledby="planes-grilla" className="grid gap-4 md:grid-cols-3 lg:gap-6">
        {plans.map((plan) => {
          const variant = plan.highlighted ? "primary" : "outline";
          return (
            <li
              key={plan.id}
              className={cn(
                "flex flex-col gap-6 rounded-3xl bg-card p-6 lg:p-7",
                plan.highlighted ? "border-2 border-action" : "border border-card-line",
              )}
            >
              <div className="flex flex-col gap-2">
                <h3 className="font-display text-2xl font-semibold text-fg">{plan.name}</h3>
                <p className="text-base text-fg-muted">{plan.description}</p>
              </div>
              <p className="flex flex-col">
                <span className="font-display text-4xl font-bold tracking-tight text-fg tabular-nums">{plan.price}</span>
                {plan.priceNote ? <span className="text-sm text-fg-muted">{plan.priceNote}</span> : null}
              </p>
              {plan.cta.kind === "whatsapp" ? (
                <ButtonAnchor
                  href={whatsappUrl(plan.cta.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant={variant}
                  size="48"
                  block
                  data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
                  data-analytics-placement={plan.cta.placement}
                >
                  <Icon name="chat" size={18} strokeWidth={1.8} className="text-brand-hover" />
                  {plan.cta.label}
                  <span className="sr-only"> {siteContent.nav.externalHint}</span>
                </ButtonAnchor>
              ) : (
                <ButtonLink
                  href={plan.cta.href}
                  variant={variant}
                  size="48"
                  block
                  data-analytics-event={ANALYTICS_EVENTS.partnerRegisterStarted}
                  data-analytics-placement={plan.cta.placement}
                >
                  {plan.cta.label}
                </ButtonLink>
              )}
              <div className="flex flex-col gap-3 border-t border-card-line pt-5">
                <p className="text-sm font-semibold text-fg">{plan.includesLabel}</p>
                <ul className="flex flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-control text-fg-muted">
                      <Icon name="check" size={18} strokeWidth={2.2} className="mt-0.5 shrink-0 text-brand-hover" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-4 rounded-3xl bg-canvas p-6 md:flex-row md:items-center md:justify-between md:gap-8 lg:px-7">
        <h3 className="font-display text-xl font-semibold text-fg md:max-w-70">{sales.title}</h3>
        <p className="text-base text-fg-muted md:max-w-100 md:flex-1">{sales.description}</p>
        <ButtonAnchor
          href={whatsappUrl(sales.whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          size="48"
          data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
          data-analytics-placement="proveedores_planes_ventas"
          className="shrink-0 self-start md:self-auto"
        >
          <Icon name="chat" size={18} strokeWidth={1.8} className="text-brand-hover" />
          {sales.cta.label}
          <span className="sr-only"> {siteContent.nav.externalHint}</span>
        </ButtonAnchor>
      </div>
    </div>
  );
}
