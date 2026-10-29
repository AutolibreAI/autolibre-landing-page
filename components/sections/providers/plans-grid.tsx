import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { providersPlansContent } from "@/lib/content/providers-plans";
import { whatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * Cards de los planes de `/proveedores/planes`, más la card de contacto con
 * ventas. Ids de cada plan en `h3` para que el outline del documento quede
 * correcto (la página los referencia como hijos del `h2` de la sección).
 */
export function ProvidersPlansGrid() {
  const { plans, sales } = providersPlansContent;

  return (
    <ul className="mx-auto grid max-w-[1100px] gap-6 md:grid-cols-3">
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
              <span className="font-display text-3xl font-bold text-ink">
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

          {/* `<a>` nativo a WhatsApp, con el mensaje ya armado según el plan:
              ningún botón de plan registra ni cobra solo, todo sigue
              gestionándose por WhatsApp o la web (ver AGENTS.md). */}
          <a
            href={whatsappUrl(plan.cta.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
            data-analytics-placement={`proveedores_planes_${plan.id}`}
            className={cn(
              buttonVariants({
                variant: plan.highlighted ? "primary" : "outline",
                block: true,
              }),
            )}
          >
            {plan.cta.label}
          </a>
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
  );
}
