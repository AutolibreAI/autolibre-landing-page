import Link from "next/link";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { FaqContactCard, FaqLayout } from "@/components/marketing/faq-layout";
import { eyebrow, sectionLead, sectionTitle } from "@/components/marketing/styles";
import { HOME_PEDIDO_ID } from "@/components/sections/home/home-hero";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { QUOTE_CTA_PLACEMENTS } from "@/lib/analytics/events";
import { FAQ_PATH, faqContent, pickFaqItems } from "@/lib/content/faq";
import { homeContent } from "@/lib/content/home";

const { faq } = homeContent;

/** Grupos de la FAQ del Home: el pedido primero y después los de la app. */
const homeFaqGroups = [
  { id: faqContent.pedidoGroup.id, name: faqContent.pedidoGroup.name, items: faq.items },
  ...faq.appGroups.map((group) => ({
    id: group.id,
    name: group.name,
    items: pickFaqItems(group.itemIds),
  })),
];

/** Todo lo que se ve en la FAQ del Home, y nada más: alimenta su `FAQPage`. */
export const homeFaqItems = homeFaqGroups.flatMap((group) => group.items);

/**
 * Preguntas frecuentes del Home. Server Component, sin JS (`<details>`
 * nativo, todas las respuestas en el HTML).
 *
 * Dos columnas desde `lg` (`FaqLayout`): a la izquierda eyebrow, `h2`,
 * bajada y la tarjeta "¿Seguís con dudas?" (sticky); a la derecha, "Tu
 * pedido" (la primera abierta) y tres grupos cortos de la app, cada uno con
 * su `h3`, y el link a `/preguntas-frecuentes`. En celular la tarjeta va al
 * final.
 */
export function FaqSection() {
  return (
    <Section id="faq" tone="canvas" spacing="md" aria-labelledby="faq-title">
      <FaqLayout
        intro={
          <>
            <p className={eyebrow}>{faq.eyebrow}</p>
            <h2 id="faq-title" className={`mt-2 ${sectionTitle}`}>
              {faq.title}
            </h2>
            <p className={`mt-3 ${sectionLead}`}>{faq.lead}</p>
          </>
        }
        aside={
          <FaqContactCard
            headingAs="h3"
            headingId="faq-contacto"
            pedidoHref={`#${HOME_PEDIDO_ID}`}
            placement={QUOTE_CTA_PLACEMENTS.homeFaq}
          />
        }
      >
        <div className="flex flex-col gap-10">
          {homeFaqGroups.map((group, index) => (
            <FaqAccordion
              key={group.id}
              items={group.items}
              openFirst={index === 0}
              heading={{ as: "h3", id: group.id, text: group.name }}
            />
          ))}
        </div>
        <Link
          href={FAQ_PATH}
          className="mt-6 inline-flex min-h-11 items-center gap-2 font-display text-base font-semibold text-fg underline underline-offset-4 transition-colors hover:text-brand-hover motion-reduce:transition-none"
        >
          {faq.allLink}
          <Icon name="arrow-right" size={18} strokeWidth={2} />
        </Link>
      </FaqLayout>
    </Section>
  );
}
