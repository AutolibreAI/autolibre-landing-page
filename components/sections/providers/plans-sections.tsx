import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { providersPlansContent } from "@/lib/content/providers-plans";
import { cn } from "@/lib/utils";

const { rules, compare, faq, closing } = providersPlansContent;

/** `h2` de sección del sistema AutoLibre AI. */
const sectionTitle = "font-display text-3xl font-bold tracking-tight text-balance text-fg md:text-4xl";

/** "Lo mismo en todos los planes": las tres reglas, en columnas con filete. */
export function PlansRulesSection() {
  return (
    <Section tone="canvas" spacing="md" aria-labelledby="planes-reglas">
      <h2 id="planes-reglas" className={sectionTitle}>
        {rules.title}
      </h2>
      <ul className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
        {rules.items.map((rule) => (
          <li key={rule.title} className="flex flex-col gap-2 border-t border-fg pt-5">
            <h3 className="font-display text-lg font-semibold text-fg">{rule.title}</h3>
            <p className="text-base text-fg-muted">{rule.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * Tabla comparativa (desde `md`; en celular las tarjetas ya lo dicen todo).
 * `<table>` real con `<th scope>`: un lector la recorre por fila y columna.
 * La columna de Plus va resaltada como su tarjeta. Los tildes y las rayas
 * llevan su texto (`sr-only`): el ícono nunca es la única señal.
 */
export function PlansCompareSection() {
  return (
    <Section tone="card" spacing="md" aria-labelledby="planes-comparar" className="max-md:hidden">
      <h2 id="planes-comparar" className={sectionTitle}>
        {compare.title}
      </h2>
      <table className="mt-8 w-full border-collapse text-left">
        <caption className="sr-only">{compare.caption}</caption>
        <thead>
          <tr className="border-b border-fg">
            <th scope="col" className="w-2/5 py-4 pr-6 text-sm font-medium text-fg-muted">
              {compare.rowHeader}
            </th>
            {compare.plans.map((plan, index) => (
              <th
                key={plan}
                scope="col"
                className={cn(
                  "px-4 py-4 text-center font-display text-lg font-semibold text-fg",
                  index === compare.highlighted && "rounded-t-2xl bg-canvas",
                )}
              >
                {plan}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {compare.rows.map((row, rowIndex) => (
            <tr key={row.label} className="border-b border-card-line">
              <th scope="row" className="py-4 pr-6 text-base font-normal text-fg-muted">
                {row.label}
              </th>
              {row.values.map((value, index) => (
                <td
                  key={compare.plans[index]}
                  className={cn(
                    "px-4 py-4 text-center text-base text-fg",
                    index === compare.highlighted && "bg-canvas",
                    index === compare.highlighted && rowIndex === compare.rows.length - 1 && "rounded-b-2xl",
                  )}
                >
                  {typeof value === "string" ? (
                    value
                  ) : value ? (
                    <>
                      <Icon name="check" size={20} strokeWidth={2.2} className="mx-auto text-fg" />
                      <span className="sr-only">{compare.included}</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true" className="text-fg-muted">
                        —
                      </span>
                      <span className="sr-only">{compare.notIncluded}</span>
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

/** "Preguntas sobre los planes" y la banda de cierre. */
export function PlansFaqSection() {
  return (
    <Section tone="canvas" spacing="md" aria-labelledby="planes-faq">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <h2 id="planes-faq" className={cn(sectionTitle, "lg:col-span-4")}>
          {faq.title}
        </h2>
        <div className="lg:col-span-8">
          <FaqAccordion items={faq.items} />
        </div>
      </div>

      <section
        aria-labelledby="planes-cierre"
        className="mt-16 flex flex-col gap-6 rounded-3xl bg-action p-7 text-white md:mt-24 md:flex-row md:items-center md:justify-between md:p-10"
      >
        <div className="flex flex-col gap-2">
          <h2 id="planes-cierre" className="font-display text-3xl font-bold tracking-tight text-balance text-white md:text-4xl">
            {closing.title}
          </h2>
          <p className="text-base text-on-dark">{closing.body}</p>
        </div>
        <ButtonLink
          href={closing.cta.href}
          variant="light"
          size="48"
          className="shrink-0 self-start md:self-auto"
          data-analytics-event={ANALYTICS_EVENTS.partnerRegisterStarted}
          data-analytics-placement="planes_cierre"
        >
          {closing.cta.label}
        </ButtonLink>
      </section>
    </Section>
  );
}
