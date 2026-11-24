import { FaqList } from "@/components/marketing/faq-list";
import { eyebrow, inlineLink, sectionTitle } from "@/components/marketing/styles";
import { Section } from "@/components/ui/section";
import { faqCategories } from "@/lib/content/faq";
import { homeContent } from "@/lib/content/home";
import { siteContent } from "@/lib/content/site";
import { siteConfig } from "@/lib/seo/config";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

const { duplicateIds } = homeContent.faq;

/**
 * Preguntas de la app (`lib/content/faq.ts`) que se muestran debajo de las
 * del pedido, por tema. Sin las que repiten una de arriba.
 */
export const homeAppFaqCategories = faqCategories.map((category) => ({
  ...category,
  items: category.items.filter((item) => !(duplicateIds as readonly string[]).includes(item.id)),
}));

/** Todo lo que se ve en la FAQ del Home: alimenta su `FAQPage`. */
export const homeFaqItems = [
  ...homeContent.faq.items,
  ...homeAppFaqCategories.flatMap((category) => category.items),
];

/**
 * Preguntas frecuentes del Home. Server Component, sin JS: `<details>`
 * nativo (antes eran pestañas client).
 *
 * Arriba, las cinco del lienzo (el pedido). Debajo, "Sobre la app": las
 * preguntas que ya publicaba el Home (documentación, diagnóstico, OBD2…),
 * agrupadas por tema en un `<details>` por grupo, para no perder ese
 * contenido indexable sin alargar la página. Todo está en el HTML.
 */
export function FaqSection() {
  const { title, contact, items, moreTitle } = homeContent.faq;
  const { externalHint } = siteContent.nav;

  return (
    <Section id="faq" tone="canvas" spacing="md" aria-labelledby="faq-title">
      <div className="flex flex-wrap gap-x-16 gap-y-6">
        <div className="min-w-0 flex-[1_1_17.5rem]">
          <h2 id="faq-title" className={sectionTitle}>
            {title}
          </h2>
          <p className="mt-2.5 text-base text-fg-muted">
            {contact.prefix}
            <a href={`mailto:${siteConfig.contact.email}`} className={inlineLink}>
              {siteConfig.contact.email}
            </a>
            {contact.middle}
            <a
              href={siteConfig.contact.whatsappChat}
              target="_blank"
              rel="noopener noreferrer"
              className={inlineLink}
              data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
              data-analytics-placement="home_faq"
            >
              {contact.whatsapp}
              <span className="sr-only"> {externalHint}</span>
            </a>
            {contact.suffix}
          </p>
        </div>

        <div className="flex min-w-0 flex-[2_1_32.5rem] flex-col gap-8">
          <FaqList items={items} />

          <div>
            <h3 className={`mb-2 ${eyebrow}`}>{moreTitle}</h3>
            <div className="flex flex-col gap-2">
              {homeAppFaqCategories.map((category) => (
                <details key={category.id} className="group rounded-xl border border-card-line bg-card">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-display text-base font-semibold text-fg [&::-webkit-details-marker]:hidden">
                    {category.name}
                    <span aria-hidden="true" className="shrink-0 text-xl leading-none text-fg-muted transition-transform group-open:rotate-45 motion-reduce:transition-none">
                      +
                    </span>
                  </summary>
                  <dl className="flex flex-col gap-4 px-5 pb-5">
                    {category.items.map((item) => (
                      <div key={item.id}>
                        <dt className="font-semibold text-fg">{item.question}</dt>
                        <dd className="mt-1 text-control text-fg-muted">{item.answer}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
