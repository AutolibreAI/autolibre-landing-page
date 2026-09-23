import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { QrCode } from "@/components/ui/qr-code";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { OpenFormButton } from "./open-form-button";
import { PedidoForm } from "./pedido-form";
import { PEDIDO_IDS } from "./shared";
import { WhatsappLink } from "./whatsapp-link";

const { hero } = presupuestoContent.pedidoPage;

/**
 * Hero de `/pedido`. Server component con el único `<h1>` de la página (y su
 * LCP: es texto, no imagen). La isla del form se monta en la columna derecha:
 * en desktop es la tarjeta "Dejanos tus datos"; en mobile no se ve hasta que
 * se toca "Quiero que me contacten".
 *
 * Escala y ritmo de `HeroSection` de la home: `Container` ancho, la misma
 * grilla y paddings, el `<h1>` con `SectionHeading size="display"` y su bajada.
 *
 * `#pedido-ctas` es el ancla que usa la barra fija mobile para saber cuándo
 * aparecer. Sin `reveal`: el hero nunca se anima (es el LCP).
 */
export function PedidoHero() {
  return (
    <section aria-labelledby={PEDIDO_IDS.heroTitle} className="bg-surface">
      <Container size="wide">
        <div className="grid items-center gap-12 py-16 md:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div>
            {/* Mismo chip que los servicios de `MarketplaceSection`. */}
            <p className="mb-6 inline-flex rounded-full bg-surface-muted px-5 py-2.5 text-sm font-medium text-ink">
              {hero.badge}
            </p>

            <SectionHeading
              as="h1"
              size="display"
              id={PEDIDO_IDS.heroTitle}
              title={hero.title}
              subtitle={hero.subtitle}
            />

            <div
              id={PEDIDO_IDS.heroCtas}
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5"
            >
              <WhatsappLink placement="hero" />
              <p className="text-label text-ink/65">{hero.whatsappNote}</p>
              <p className="flex items-center gap-3 text-label text-ink/65 lg:hidden sm:w-full">
                <span aria-hidden="true" className="h-px flex-1 bg-line" />
                {hero.divider}
                <span aria-hidden="true" className="h-px flex-1 bg-line" />
              </p>
              <OpenFormButton
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "lg:hidden",
                })}
              >
                {hero.formCta}
              </OpenFormButton>
            </div>

            {/* Puente para quien llegó desde la compu: el chat se abre en el
                teléfono. En mobile no tiene sentido (ya está en el teléfono). */}
            <div className="mt-10 hidden max-w-120 items-center gap-5 rounded-card border border-line bg-surface-subtle p-5 lg:flex">
              <QrCode
                code="pedidoWhatsapp"
                title={hero.qr.alt}
                className="size-28 shrink-0 rounded-field bg-surface text-ink"
              />
              <div>
                <p className="font-display text-base font-semibold text-ink">
                  {hero.qr.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{hero.qr.body}</p>
              </div>
            </div>

            <ul className="mt-8 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:gap-x-6">
              {hero.checks.map((check) => (
                <li key={check} className="flex items-center gap-2.5 text-sm text-ink/70">
                  <Icon name="check" size={18} strokeWidth={2.2} className="shrink-0 text-brand" />
                  {check}
                </li>
              ))}
            </ul>
          </div>

          <PedidoForm />
        </div>
      </Container>
    </section>
  );
}
