import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { cn } from "@/lib/utils";
import { OpenFormButton } from "./open-form-button";
import { PEDIDO_IDS } from "./shared";
import { WhatsappLink } from "./whatsapp-link";

const { steps, example, faq, ctaBand } = presupuestoContent.pedidoPage;

/**
 * Secciones de contenido de `/pedido`, todas server. El título de cada una es
 * un `h2` (jerarquía por outline, no por tamaño) y su primera oración se
 * puede citar sola.
 *
 * Escala de la home, rol por rol:
 * - `h2` de sección: `SectionHeading size="md"` (el de `QuotesSection`).
 * - Tarjetas: `Card` con la anatomía de `FeaturesSection` (ícono de línea en
 *   verde, `h3` en display `text-base` semibold, cuerpo `text-sm` al 70%).
 * - Preguntas: la tipografía de `FaqSection`, abiertas (sin acordeón).
 * - Ritmo: `Section spacing="sm"` (`py-12 md:py-16`). Van seguidas sobre el
 *   mismo fondo, así que cada una lleva solo su padding de arriba (si no, el
 *   aire entre dos se duplica); el de abajo lo pone la banda de cierre.
 */

const stacked = "pb-0 md:pb-0";

/** Link dentro de un texto: el de la home (`HeroSection`, "pedí presupuesto"). */
const inlineLink =
  "font-semibold text-brand-hover underline decoration-brand-hover/40 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink";

export function PedidoSteps() {
  const titleId = `${PEDIDO_IDS.steps}-titulo`;
  return (
    <Section
      id={PEDIDO_IDS.steps}
      tone="muted"
      spacing="sm"
      aria-labelledby={titleId}
      className={cn("reveal", stacked)}
    >
      <SectionHeading as="h2" size="md" id={titleId} title={steps.title} />
      <ol className="mt-8 grid gap-4 md:mt-12 lg:grid-cols-3 lg:gap-6">
        {steps.items.map((step, index) => (
          <Card
            key={step.title}
            as="li"
            className="flex gap-4 px-5 py-6 lg:flex-col lg:gap-4.5 lg:py-7"
          >
            <Icon name={step.icon} className="shrink-0 text-brand" />
            <div>
              <h3 className="mb-2 font-display text-base font-semibold text-ink">
                {index + 1}. {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink/70">{step.body}</p>
            </div>
          </Card>
        ))}
      </ol>
    </Section>
  );
}

/**
 * Globo de chat. Mobile: tope fijo de `max-w-72`, como en el teléfono. En
 * desktop la columna es mucho más ancha que un teléfono: el tope pasa a ser
 * proporcional (5/6 de la tarjeta, lo que usa un globo en WhatsApp Web), así
 * el ejemplo no deja media tarjeta vacía ni se estira más que la FAQ de al
 * lado.
 */
const bubble =
  "max-w-72 rounded-card px-4 py-3 text-sm leading-relaxed text-ink lg:max-w-11/12 lg:leading-snug";
/** Globo recibido: blanco con borde sobre la tarjeta suave, como en el chat real. */
const received = cn(bubble, "self-start rounded-bl-sm border border-line bg-surface");

/**
 * Chat de ejemplo. Es un `<figure>` con su `<figcaption>` "Ejemplo
 * ilustrativo" a la vista: proveedores, teléfonos y precios son inventados y
 * tiene que quedar claro para quien lo lee (y para un LLM que lo cite).
 */
export function PedidoExample() {
  const titleId = `${PEDIDO_IDS.example}-titulo`;
  const { emoji } = example;
  return (
    <Section
      id={PEDIDO_IDS.example}
      tone="muted"
      spacing="sm"
      aria-labelledby={titleId}
      className={cn("reveal", stacked)}
      // Columna de la grilla de `/pedido`, que ya vive en un `Container`.
      container={false}
    >
      <SectionHeading as="h2" size="md" id={titleId} title={example.title} />
      <figure className="mt-8 flex flex-col gap-3 rounded-card border border-line bg-surface-subtle p-5 md:mt-12 lg:p-6">
        <div className={cn(bubble, "self-end rounded-br-sm bg-surface-muted")}>
          <span className="sr-only">{example.you} </span>
          {example.userMessage}
        </div>

        <div className={received}>
          <span className="sr-only">{example.us} </span>
          {example.confirmationLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        {/* Desktop: los dos presupuestos lado a lado, como dos fichas del
            mismo mensaje; se comparan de un vistazo y el globo no se estira
            para abajo. Este globo puede usar todo el ancho (a 1024 cada
            columna necesita el teléfono entero en una línea). */}
        <div className={cn(received, "flex flex-col gap-4 lg:max-w-full lg:grid lg:grid-cols-2 lg:gap-x-4")}>
          <span className="sr-only">{example.us}</span>
          {example.providers.map((provider) => (
            <div key={provider.name}>
              <p>{provider.name}</p>
              <p>{provider.service}</p>
              <p>
                <span aria-hidden="true">{emoji.address} </span>
                {provider.address}
              </p>
              <p className="whitespace-nowrap">
                <span aria-hidden="true">{emoji.phone} </span>
                {provider.phone}
              </p>
              <p>
                <span aria-hidden="true">{emoji.price} </span>
                {provider.price}
              </p>
              <p>
                <span aria-hidden="true">{emoji.eta} </span>
                {provider.eta}
              </p>
            </div>
          ))}
        </div>

        <figcaption className="text-label text-ink/65">{example.caption}</figcaption>
      </figure>
    </Section>
  );
}

/**
 * Preguntas frecuentes, abiertas: nada detrás de un acordeón. Son las mismas
 * que declara el `FAQPage` de la página (sale del mismo contenido). Pregunta y
 * respuesta con la tipografía de `FaqSection` de la home.
 */
export function PedidoFaq() {
  const titleId = `${PEDIDO_IDS.faq}-titulo`;
  return (
    <Section
      id={PEDIDO_IDS.faq}
      tone="muted"
      spacing="sm"
      aria-labelledby={titleId}
      className={cn("reveal", stacked)}
      // Columna de la grilla de `/pedido`, que ya vive en un `Container`.
      container={false}
    >
      <SectionHeading as="h2" size="md" id={titleId} title={faq.title} />
      <div className="mt-8 flex flex-col gap-2.5 md:mt-12">
        {faq.items.map((item) => (
          <Card key={item.question} className="px-6 py-5">
            <h3 className="font-display text-base font-semibold text-ink">{item.question}</h3>
            {/* 15px al 72%: la respuesta de `FaqSection` tal cual; no hay un
                escalón canónico entre `text-sm` y `text-base`. */}
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink/72">
              <FaqAnswer item={item} />
            </p>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function FaqAnswer({
  item,
}: {
  readonly item: {
    readonly answer: string;
    readonly link?: { readonly text: string; readonly href: string };
  };
}) {
  const { answer, link } = item;
  const at = link ? answer.indexOf(link.text) : -1;
  if (!link || at === -1) return answer;
  return (
    <>
      {answer.slice(0, at)}
      <Link href={link.href} className={inlineLink}>
        {link.text}
      </Link>
      {answer.slice(at + link.text.length)}
    </>
  );
}

/**
 * Banda de cierre, en tinta como `QuotesSection` de la home (su `h2`, su
 * bajada y sus botones). Mientras se ve, la barra fija mobile se esconde.
 */
export function PedidoCtaBand() {
  const titleId = `${PEDIDO_IDS.ctaBand}-titulo`;
  return (
    <Section
      id={PEDIDO_IDS.ctaBand}
      tone="muted"
      spacing="sm"
      aria-labelledby={titleId}
      className="reveal"
    >
      <div className="flex flex-col gap-8 rounded-panel bg-ink px-6 py-10 selection:bg-brand selection:text-white md:px-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-14 lg:py-14">
        <SectionHeading
          as="h2"
          size="md"
          onDark
          id={titleId}
          title={ctaBand.title}
          subtitle={ctaBand.subtitle}
          className="min-w-0 flex-1 *:text-pretty"
        />
        {/* Desktop: los botones apilados (mismo ancho) a la derecha. En fila
            ocupaban ~530px y partían el título en dos aun a 1440; apilados,
            el título entra en una línea desde 1280. */}
        <div className="flex shrink-0 flex-wrap gap-3 lg:flex-col lg:flex-nowrap">
          <WhatsappLink placement="cta_band" variant="inverse" className="w-full sm:w-auto lg:w-full" />
          <OpenFormButton
            className={buttonVariants({
              variant: "outlineInverse",
              size: "lg",
              className: "w-full sm:w-auto lg:w-full",
            })}
          >
            {ctaBand.formCta}
          </OpenFormButton>
        </div>
      </div>
    </Section>
  );
}
