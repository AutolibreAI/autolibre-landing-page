import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { providersPlansContent } from "@/lib/content/providers-plans";
import { PROVEEDORES_CONTRATAR_PATH } from "@/lib/proveedores/query";
import { whatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * Cards de los planes de `/proveedores/planes`, más la card de contacto con
 * ventas. Ids de cada plan en `h3` para que el outline del documento quede
 * correcto (la página los referencia como hijos del `h2` de la sección).
 */
export function ProvidersPlansGrid() {
  const { plans, notes, sales } = providersPlansContent;

  return (
    <div className="mx-auto max-w-275">
      <ul className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            as="li"
            variant={plan.highlighted ? "elevated" : "outline"}
            className={cn(
              "flex flex-col gap-6 p-8",
              plan.highlighted && "border-2 border-brand",
            )}
          >
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                {plan.name}
              </h3>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-bold text-ink tabular-nums">
                  {plan.price}
                </span>
                {plan.priceNote ? (
                  <span className="text-[0.9375rem] text-ink/60">
                    {plan.priceNote}
                  </span>
                ) : null}
              </p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink/70">
                {plan.description}
              </p>
            </div>

            <ul className="flex flex-1 flex-col gap-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Icon
                    name="check"
                    size={18}
                    className="mt-0.5 shrink-0 text-brand"
                  />
                  <span className="text-[0.9375rem] leading-relaxed text-ink/80">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* El plan gratis lleva al hub del alta (ya aparece o registrar); los
                pagos, a la contratación online (spec 212), que es privada y
                carga Clerk: sin prefetch (ni en viewport ni en hover), así
                esta página indexable no baja nada de Clerk (SC-005). */}
            <ButtonLink
              href={plan.cta.href}
              prefetch={
                plan.cta.href.startsWith(PROVEEDORES_CONTRATAR_PATH)
                  ? false
                  : undefined
              }
              variant={plan.highlighted ? "primary" : "outline"}
              block
              {...("analyticsPlan" in plan.cta
                ? {
                    "data-analytics-event": ANALYTICS_EVENTS.planCheckoutStarted,
                    "data-analytics-plan": plan.cta.analyticsPlan,
                  }
                : {})}
            >
              {plan.cta.label}
            </ButtonLink>
          </Card>
        ))}

        <Card
          as="li"
          variant="outline"
          className="flex flex-col gap-4 p-8 md:col-span-3 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h3 className="font-display text-lg font-bold text-ink">
              {sales.title}
            </h3>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink/70">
              {sales.description}
            </p>
          </div>
          {/* `<a>` nativo: sale del sitio a WhatsApp, igual criterio que el
              resto de los links de WhatsApp del sitio. */}
          <a
            href={whatsappUrl(sales.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
            data-analytics-placement="proveedores_planes_ventas"
            className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
          >
            {sales.cta.label}
          </a>
        </Card>
      </ul>

      <ul className="mt-6 flex flex-col gap-1.5">
        {notes.map((note) => (
          <li
            key={note}
            className="text-label leading-relaxed text-ink/65"
          >
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}
