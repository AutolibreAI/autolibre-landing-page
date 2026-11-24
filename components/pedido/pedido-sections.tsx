import Link from "next/link";
import { FaqList } from "@/components/marketing/faq-list";
import { GuideLinks } from "@/components/marketing/guide-links";
import { NumberedSteps } from "@/components/marketing/numbered-steps";
import { eyebrow, sectionTitle, sectionTitleLg } from "@/components/marketing/styles";
import { ModuloPedido } from "@/components/modulo-pedido/modulo-pedido";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import {
  ANALYTICS_EVENTS,
  LEAD_SOURCES,
  QUOTE_CTA_PLACEMENTS,
  QUOTE_MODULE_PLACEMENTS,
} from "@/lib/analytics/events";
import { getGuidePicks } from "@/lib/blog/picks";
import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { siteContent } from "@/lib/content/site";
import { whatsappUrl } from "@/lib/whatsapp";

const page = presupuestoContent.pedidoPage;

/** Ancla del hero: la usan la barra fija del celular y la banda de cierre. */
export const PEDIDO_ID = "pedido";

/**
 * Secciones de `/pedido` (rediseño 2026-11, fase 4a), todas server. Cada
 * sección arranca con su `h2` (jerarquía por outline, no por tamaño) y su
 * primera oración se puede citar sola.
 */

/**
 * Hero: migas, sello, `<h1>` (con "presupuesto", por SEO) y el módulo de
 * pedido como formulario. El LCP es el `<h1>`: texto del server, sin
 * animación ni `reveal`.
 */
export function PedidoHero() {
  const { hero, meta } = page;
  return (
    <Section
      id={PEDIDO_ID}
      tone="card"
      spacing="sm"
      aria-labelledby="pedido-titulo"
      className="scroll-mt-17 border-t-0 pt-5 md:pt-7"
    >
      <nav aria-label={meta.breadcrumbLabel}>
        <ol className="flex items-center gap-2 text-sm text-fg-muted">
          <li>
            <Link href="/" className="flex min-h-11 items-center underline underline-offset-4 hover:text-fg">
              {meta.homeBreadcrumb}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-fg">
            {meta.breadcrumb}
          </li>
        </ol>
      </nav>

      <div className="mt-3 flex flex-col items-center text-center md:mt-6">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-canvas px-3.5 py-1.5 text-label font-semibold text-action">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
          {hero.badge}
        </p>
        <h1
          id="pedido-titulo"
          className="max-w-205 font-display text-display-xs font-bold tracking-tight text-balance text-fg xs:text-display-sm sm:text-display-md"
        >
          {hero.title}
        </h1>
        <p className="mt-3.5 max-w-150 text-lead text-pretty text-fg-muted md:text-lead-lg">
          {hero.subtitle}
        </p>
      </div>

      <ModuloPedido placement={QUOTE_MODULE_PLACEMENTS.pedido} idPrefix="pedido-modulo" className="mt-6" />

      <ul className="mx-auto mt-8 flex max-w-230 flex-col gap-x-9 gap-y-2.5 border-t border-card-line pt-5 text-control text-fg-muted sm:flex-row sm:flex-wrap sm:justify-center">
        {hero.checks.map((check) => (
          <li key={check} className="flex items-center gap-2">
            <Icon name="check" size={18} strokeWidth={2.4} className="shrink-0 text-brand-hover" />
            {check}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * "Así te llega la respuesta": texto + chat de ejemplo. Es un `<figure>` con
 * su `<figcaption>` "Ejemplo ilustrativo" a la vista: proveedores, precios y
 * direcciones son inventados y tiene que quedar claro para quien lo lee (y
 * para un LLM que lo cite).
 */
export function PedidoExample() {
  const { example } = page;
  const bubble = "rounded-card px-3.5 py-3 text-control";
  return (
    <Section id="asi-te-llega" tone="canvas" spacing="md" aria-labelledby="asi-te-llega-titulo">
      <div className="flex flex-wrap items-start gap-x-16 gap-y-8">
        <div className="flex min-w-0 flex-[1_1_20rem] flex-col gap-3">
          <h2 id="asi-te-llega-titulo" className={sectionTitle}>
            {example.title}
          </h2>
          {example.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-lead text-fg-muted">
              {paragraph}
            </p>
          ))}
        </div>

        <figure className="flex min-w-0 flex-[1.4_1_27.5rem] flex-col gap-3 rounded-panel border border-card-line bg-card p-4 md:p-6">
          <p className={`${bubble} max-w-4/5 self-end rounded-br-sm bg-action text-card`}>
            <span className="sr-only">{example.you} </span>
            {example.userMessage}
          </p>
          <div className={`${bubble} flex max-w-5/6 flex-col gap-1 self-start rounded-bl-sm bg-canvas text-fg-muted`}>
            <span className="sr-only">{example.us} </span>
            <p>{example.confirmation.intro}</p>
            <ul>
              {example.confirmation.lines.map((line) => (
                <li key={line}>
                  <span aria-hidden="true">· </span>
                  {line}
                </li>
              ))}
            </ul>
            <p>{example.confirmation.outro}</p>
          </div>
          <div className={`${bubble} flex max-w-5/6 flex-col gap-2.5 self-start rounded-bl-sm bg-canvas text-fg-muted`}>
            <span className="sr-only">{example.us}</span>
            {example.providers.map((provider, index) => (
              <div key={provider.name} className={index > 0 ? "border-t border-control-line pt-2.5" : undefined}>
                <p className="font-semibold text-fg">{provider.name}</p>
                <p>{provider.service}</p>
                <p>
                  <strong className="text-fg">{provider.price}</strong> · {provider.eta} · {provider.address}
                </p>
              </div>
            ))}
          </div>
          <figcaption className="text-label text-fg-muted">{example.caption}</figcaption>
        </figure>
      </div>
    </Section>
  );
}

/** Cómo funciona: tres pasos numerados (`h3` cada uno). */
export function PedidoSteps() {
  const { steps } = page;
  return (
    <Section id="como-funciona" tone="card" spacing="md" aria-labelledby="como-funciona-titulo">
      <h2 id="como-funciona-titulo" className={sectionTitle}>
        {steps.title}
      </h2>
      <NumberedSteps steps={steps.items} className="mt-8" />
    </Section>
  );
}

/**
 * FAQ (`<details>`, las mismas preguntas que el `FAQPage`) y, al lado, guías
 * del blog relacionadas (de Hygraph, en el server; si no hay, no se muestra
 * la columna).
 */
export async function PedidoFaqAndGuides() {
  const { faq, guides } = page;
  const { picked } = BLOG_PUBLIC
    ? await getGuidePicks({ latest: 0, slugs: guides.slugs })
    : { picked: [] };

  return (
    <Section id="preguntas-frecuentes" tone="canvas" spacing="md" aria-labelledby="preguntas-frecuentes-titulo">
      <div className="flex flex-wrap items-start gap-x-16 gap-y-8">
        <div className="flex min-w-0 flex-[2_1_32.5rem] flex-col gap-3">
          <h2 id="preguntas-frecuentes-titulo" className={sectionTitle}>
            {faq.title}
          </h2>
          <FaqList items={faq.items} />
        </div>

        {picked.length > 0 ? (
          <aside aria-labelledby="guias-relacionadas" className="flex min-w-0 flex-[1_1_18.75rem] flex-col">
            <h2 id="guias-relacionadas" className={`mb-2 ${eyebrow}`}>
              {guides.title}
            </h2>
            <GuideLinks
              posts={picked}
              arrow={false}
              className="border-y border-control-line"
              itemClassName="py-3.5 font-display text-lg leading-snug font-semibold"
            />
            <Link
              href="/blog"
              className="mt-1.5 flex min-h-11 items-center text-control font-semibold text-fg underline underline-offset-4 hover:text-brand-hover"
            >
              {guides.all}
            </Link>
          </aside>
        ) : null}
      </div>
    </Section>
  );
}

/**
 * Banda de cierre sobre `action`: "Hacé tu pedido" sube al módulo y
 * WhatsApp es la segunda opción (con borde). El WhatsApp de `/pedido` es un
 * `Lead` (`lead_source: "whatsapp"`), como el del módulo.
 */
export function PedidoCtaBand() {
  const { ctaBand, whatsapp } = page;
  const { externalHint } = siteContent.nav;
  return (
    <Section id="pedido-cierre" tone="canvas" spacing="md" aria-labelledby="pedido-cierre-titulo" className="pt-0 md:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-6 rounded-3xl bg-action p-7 text-white md:p-10 lg:p-14">
        <div className="min-w-0 flex-[1_1_23.75rem]">
          <h2 id="pedido-cierre-titulo" className={sectionTitleLg}>
            {ctaBand.title}
          </h2>
          <p className="mt-2.5 text-lg text-on-dark">{ctaBand.subtitle}</p>
        </div>
        <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
          <ButtonLink
            href={`#${PEDIDO_ID}`}
            variant="light"
            size="52"
            className="max-sm:w-full"
            data-analytics-event={ANALYTICS_EVENTS.quoteCtaClicked}
            data-analytics-quote-placement={QUOTE_CTA_PLACEMENTS.pedidoCtaBand}
          >
            {ctaBand.formCta}
          </ButtonLink>
          <ButtonAnchor
            href={whatsappUrl(whatsapp.text)}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlineDark"
            size="52"
            className="max-sm:w-full"
            data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
            data-analytics-placement="cta_band"
            data-analytics-lead-source={LEAD_SOURCES.whatsapp}
          >
            <Icon name="whatsapp" size={20} strokeWidth={1.8} className="text-brand-200" />
            {whatsapp.label}
            <span className="sr-only"> {externalHint}</span>
          </ButtonAnchor>
        </div>
      </div>
    </Section>
  );
}
