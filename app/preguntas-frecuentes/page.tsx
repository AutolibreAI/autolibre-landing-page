import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { FaqContactCard, FaqLayout } from "@/components/marketing/faq-layout";
import { eyebrow, sectionLead } from "@/components/marketing/styles";
import { JsonLd } from "@/components/seo/json-ld";
import { Section } from "@/components/ui/section";
import { QUOTE_CTA_PLACEMENTS } from "@/lib/analytics/events";
import { FAQ_PATH, faqCategories, faqContent } from "@/lib/content/faq";
import { homeContent } from "@/lib/content/home";
import { siteContent } from "@/lib/content/site";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  faqPageSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const { page, pedidoGroup, duplicateIds } = faqContent;
const { meta } = page;

export const metadata: Metadata = createMetadata({
  title: meta.title,
  description: meta.description,
  path: FAQ_PATH,
});

/**
 * Grupos de la página: primero el pedido (las del Home) y después todas las
 * categorías de la app, sin las que repiten una del pedido.
 */
const groups = [
  { id: pedidoGroup.id, name: pedidoGroup.name, items: homeContent.faq.items },
  ...faqCategories.map((category) => ({
    id: category.id,
    name: category.name,
    items: category.items.filter(
      (item) => !(duplicateIds as readonly string[]).includes(item.id),
    ),
  })),
].filter((group) => group.items.length > 0);

const schema = graph(
  organizationSchema(),
  webPageSchema({ name: meta.title, description: meta.description, path: FAQ_PATH }),
  breadcrumbSchema([
    { name: meta.homeBreadcrumb, path: "/" },
    { name: meta.breadcrumb, path: FAQ_PATH },
  ]),
  // Exactamente las preguntas visibles, en el mismo orden.
  faqPageSchema(groups.flatMap((group) => group.items)),
);

/**
 * `/preguntas-frecuentes`: todas las preguntas del sitio en una página.
 * Server Component, sin una sola isla client: `<details>` nativo con todas
 * las respuestas en el HTML, índice de categorías con anclas `<a>` (sin JS)
 * y la tarjeta "¿Seguís con dudas?" (sticky desde `lg`, al final en
 * celular).
 *
 * Outline: h1 → h2 por categoría → h2 de la tarjeta de contacto. Las
 * preguntas son `<summary>`, no headings.
 */
export default function PreguntasFrecuentesPage() {
  return (
    <>
      <PageShell currentPath={FAQ_PATH}>
        <Section tone="canvas" spacing="md" aria-labelledby="preguntas-frecuentes-titulo">
          <header className="max-w-200">
            <h1
              id="preguntas-frecuentes-titulo"
              className="font-display text-4xl leading-tight font-bold tracking-tight text-balance text-fg md:text-5xl"
            >
              {page.title}
            </h1>
            <p className={`mt-4 ${sectionLead}`}>{page.lead}</p>
          </header>

          <div className="mt-10 md:mt-14">
            <FaqLayout
              intro={
                <nav aria-labelledby="preguntas-frecuentes-indice">
                  <p id="preguntas-frecuentes-indice" className={eyebrow}>
                    {page.indexLabel}
                  </p>
                  <ul className="mt-3 border-t border-fg">
                    {groups.map((group) => (
                      <li key={group.id} className="border-b border-card-line">
                        <a
                          href={`#${group.id}`}
                          className="flex min-h-11 items-center py-2 font-display text-base font-semibold text-fg transition-colors hover:text-brand-hover motion-reduce:transition-none"
                        >
                          {group.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              }
              aside={
                <FaqContactCard
                  headingAs="h2"
                  headingId="preguntas-frecuentes-contacto"
                  pedidoHref={siteContent.nav.quoteLink.href}
                  placement={QUOTE_CTA_PLACEMENTS.faqPage}
                />
              }
            >
              <div className="flex flex-col gap-12">
                {groups.map((group) => (
                  <section
                    key={group.id}
                    id={group.id}
                    aria-labelledby={`${group.id}-titulo`}
                    className="scroll-mt-24"
                  >
                    <FaqAccordion
                      items={group.items}
                      heading={{ as: "h2", id: `${group.id}-titulo`, text: group.name }}
                    />
                  </section>
                ))}
              </div>
            </FaqLayout>
          </div>
        </Section>
      </PageShell>
      <JsonLd schema={schema} />
    </>
  );
}
