import Link from "next/link";
import { Breadcrumbs, type Crumb } from "@/components/marketing/breadcrumbs";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { FlowSteps } from "@/components/proveedores/flow/flow-steps";
import { SumateChatExample } from "@/components/proveedores/registro/sumate-chat-example";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { buildSignInHref } from "@/lib/auth/sign-in-redirect";
import { providersContent } from "@/lib/content/providers";
import { providersPlansContent } from "@/lib/content/providers-plans";
import { siteContent } from "@/lib/content/site";
import {
  PROVEEDORES_PATH,
  PROVEEDORES_PLANES_PATH,
  PROVEEDORES_Q_MAX_LENGTH,
  PROVEEDORES_RECLAMAR_PATH,
  PROVEEDORES_REGISTRO_ALTA_PATH,
} from "@/lib/proveedores/query";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

const { sumate } = providersContent;
const { form } = providersContent;
const REGISTER_HREF = buildSignInHref(PROVEEDORES_REGISTRO_ALTA_PATH);

/** `h2` de sección del sistema AutoLibre AI. */
const sectionTitle = "font-display text-3xl font-bold tracking-tight text-balance text-fg md:text-4xl";
const textLink =
  "font-semibold text-fg underline underline-offset-4 transition-colors hover:text-brand-hover motion-reduce:transition-none";

/**
 * Link al flujo del alta, que empieza por la cuenta: va a
 * `/ingresar?redirect=/proveedores/registro?alta=1`. Con sesión, `proxy.ts`
 * devuelve directo al alta (un 307, sin JS en esta landing para saber si hay
 * sesión). Sin prefetch: `/ingresar` trae Clerk y no se baja hasta que la
 * persona lo pide.
 */
function RegisterLink({
  placement,
  className,
  size = "52",
  children,
}: {
  readonly placement: string;
  readonly className?: string;
  readonly size?: "48" | "52";
  readonly children: React.ReactNode;
}) {
  return (
    <ButtonLink
      href={REGISTER_HREF}
      prefetch={false}
      variant="primary"
      size={size}
      className={className}
      data-analytics-event={ANALYTICS_EVENTS.partnerRegisterStarted}
      data-analytics-placement={placement}
    >
      {children}
    </ButtonLink>
  );
}

/**
 * Hero de la landing "Sumá tu negocio" (lienzo `Sumate`): migas, rótulo, el
 * único `<h1>` (texto del server, el LCP), bajada, tres tildes y los dos
 * botones; a la derecha, un ejemplo ILUSTRATIVO: cómo llega un pedido por
 * el chat de WhatsApp de AutoLibre, con datos ficticios (`SumateChatExample`).
 */
export function SumateHero({ breadcrumbs }: { readonly breadcrumbs: readonly Crumb[] }) {
  const { hero } = sumate;

  return (
    <Section tone="card" spacing="sm" aria-labelledby="sumate-titulo" className="border-t-0 pt-5 md:pt-7 md:pb-20">
      <Breadcrumbs items={breadcrumbs} label={sumate.breadcrumbLabel} />

      <div className="mt-6 grid gap-10 md:mt-10 lg:grid-cols-12 lg:items-center lg:gap-16">
        <div className="flex flex-col gap-5 lg:col-span-6">
          <p className="text-sm font-semibold text-brand-hover">{hero.eyebrow}</p>
          <h1
            id="sumate-titulo"
            className="font-display text-display-xs font-bold tracking-tight text-balance text-fg sm:text-display-sm"
          >
            {hero.title}
          </h1>
          <p className="max-w-140 text-lead text-fg-muted md:text-lead-lg">{hero.lead}</p>
          <ul className="flex flex-col gap-2.5">
            {hero.checks.map((check) => (
              <li key={check} className="flex items-start gap-2.5 text-base text-fg-muted">
                <Icon name="check" size={18} strokeWidth={2.4} className="mt-1 shrink-0 text-brand-hover" />
                {check}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-3">
            <RegisterLink placement="registro_hero">{hero.primary}</RegisterLink>
            <ButtonLink href={PROVEEDORES_PLANES_PATH} variant="outline" size="52">
              {hero.secondary}
            </ButtonLink>
          </div>
        </div>

        {/* Marco verde suave: el ejemplo es SOLO el chat (una `<figure>` con
            su leyenda adentro). */}
        <div className="rounded-3xl bg-brand-50 p-4 sm:p-7 lg:col-span-6">
          <SumateChatExample />
        </div>
      </div>
    </Section>
  );
}

/**
 * "¿Tu negocio ya aparece?": buscar en el directorio antes de registrarse
 * dos veces. Form GET a `/proveedores?q=` (funciona sin JS), WhatsApp para
 * pedir administrarlo y el link al canje si ya tiene un código.
 *
 * Es la ÚLTIMA sección de la página (2026-11-27; antes era la segunda): va
 * después de `SumateFaq`, que también es `canvas`, así que no repite el
 * padding de arriba (`pt-0`): las dos se leen como una sola banda que cierra
 * con esta tarjeta, antes del pie oscuro.
 */
export function SumateListed() {
  const { listed } = sumate;
  return (
    <Section tone="canvas" spacing="md" aria-labelledby="sumate-ya-aparece" className="pt-0 md:pt-0">
      <div className="mx-auto flex max-w-245 flex-col items-center gap-5 rounded-3xl bg-card px-6 py-10 text-center sm:px-10 md:py-12">
        <h2 id="sumate-ya-aparece" className={sectionTitle}>
          {listed.title}
        </h2>
        <p className="max-w-140 text-base text-fg-muted">{listed.body}</p>
        <form
          action={PROVEEDORES_PATH}
          method="get"
          role="search"
          aria-label={listed.title}
          className="mt-2 flex w-full max-w-140 items-center gap-2 rounded-full border border-control-line-strong bg-card py-1.5 pr-1.5 pl-5 focus-within:border-action"
        >
          <Icon name="search" size={20} strokeWidth={2} className="shrink-0 text-fg-muted" />
          <label htmlFor="sumate-buscar" className="sr-only">
            {listed.searchLabel}
          </label>
          <input
            id="sumate-buscar"
            name="q"
            type="search"
            maxLength={PROVEEDORES_Q_MAX_LENGTH}
            placeholder={listed.searchPlaceholder}
            className="h-11 min-w-0 flex-1 bg-transparent text-base text-fg placeholder:text-fg-subtle focus-visible:outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center rounded-full bg-action px-5 font-display text-control font-semibold text-white transition-colors hover:bg-action-hover motion-reduce:transition-none"
          >
            {listed.searchSubmit}
          </button>
        </form>
        <a
          href={whatsappUrl(listed.whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
          data-analytics-placement="registro_ya_aparece"
          className={cn(textLink, "inline-flex min-h-11 items-center gap-2")}
        >
          <Icon name="chat" size={18} strokeWidth={1.8} className="text-brand-hover" />
          {listed.whatsappCta}
          <span className="sr-only"> {siteContent.nav.externalHint}</span>
        </a>
        <p className="text-sm text-fg-muted">
          {listed.claimPrefix}{" "}
          <Link
            href={PROVEEDORES_RECLAMAR_PATH}
            prefetch={false}
            data-analytics-event={ANALYTICS_EVENTS.partnerClaimStarted}
            data-analytics-placement="registro_ya_aparece"
            className={textLink}
          >
            {listed.claimCta}
          </Link>
        </p>
      </div>
    </Section>
  );
}

/** "Qué tenés al sumarte": cuatro columnas abiertas, sin tarjetas. */
export function SumateBenefits() {
  const { benefits } = sumate;
  return (
    <Section tone="canvas" spacing="md" aria-labelledby="sumate-beneficios">
      <h2 id="sumate-beneficios" className={sectionTitle}>
        {benefits.title}
      </h2>
      <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
        {benefits.items.map((item) => (
          <li key={item.title} className="flex flex-col gap-2">
            <Icon name={item.icon} size={26} strokeWidth={1.8} className="mb-2 text-fg" />
            <h3 className="font-display text-lg font-semibold text-fg">{item.title}</h3>
            <p className="text-base text-fg-muted">{item.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * "Cómo es el registro": los tres pasos a la izquierda y, a la derecha, cómo
 * se sigue la solicitud después de enviarla (la misma línea de tiempo que ve
 * el negocio al terminar el alta).
 */
export function SumateSteps() {
  const { steps } = sumate;
  const { timeline } = form.success;
  return (
    <Section tone="card" spacing="md" aria-labelledby="sumate-pasos">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
        <div className="flex flex-col gap-8 lg:col-span-6">
          <h2 id="sumate-pasos" className={sectionTitle}>
            {steps.title}
          </h2>
          <ol className="flex flex-col">
            {steps.items.map((item, index) => {
              const last = index === steps.items.length - 1;
              return (
                <li key={item.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-fg font-display text-sm font-semibold text-fg"
                    >
                      {index + 1}
                    </span>
                    {last ? null : <span aria-hidden="true" className="my-1 w-px flex-1 bg-control-line" />}
                  </div>
                  <div className={cn("flex flex-col gap-1 pt-1", last ? "pb-0" : "pb-7")}>
                    <h3 className="font-display text-lg font-semibold text-fg">{item.title}</h3>
                    {"body" in item ? <p className="text-base text-fg-muted">{item.body}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
          <RegisterLink placement="registro_pasos" className="self-start">
            {steps.cta}
          </RegisterLink>
        </div>
        <div className="flex flex-col gap-5 rounded-3xl bg-canvas p-6 sm:p-7 lg:col-span-6">
          <p className="text-sm font-semibold text-fg">{steps.timelineTitle}</p>
          <FlowSteps
            orientation="vertical"
            label={timeline.label}
            steps={timeline.steps}
            current={1}
            currentBadge={timeline.currentBadge}
          />
        </div>
      </div>
    </Section>
  );
}

/**
 * "Empezás gratis…": los precios en corto sobre la banda oscura (primer
 * trabajo, trabajo suelto y pack). Salen de `providers-plans.ts` (los de la
 * página de precios: no se escriben dos veces).
 */
export function SumatePlans() {
  const { plans } = sumate;
  return (
    <Section tone="action" spacing="md" aria-labelledby="sumate-planes">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 id="sumate-planes" className="font-display text-3xl font-bold tracking-tight text-balance text-white md:text-4xl">
            {plans.title}
          </h2>
          <p className="text-base text-on-dark">{plans.lead}</p>
        </div>
        <ButtonLink href={PROVEEDORES_PLANES_PATH} variant="outlineDark" size="48" className="shrink-0 self-start md:self-auto">
          {plans.cta}
        </ButtonLink>
      </div>
      <ul className="mt-10 grid gap-8 md:grid-cols-3 md:gap-0">
        {providersPlansContent.plans.map((plan) => (
          <li key={plan.id} className="flex flex-col gap-2 border-l border-on-dark-subtle pl-5 md:px-6">
            <h3 className="font-display text-lg font-semibold text-white">{plan.name}</h3>
            <p className="text-sm text-on-dark-muted">{plan.description}</p>
            <p className="mt-auto pt-3">
              <span className="font-display text-3xl font-bold text-white tabular-nums">{plan.price}</span>
              {plan.priceNote ? <span className="ml-1.5 text-sm text-on-dark-muted">{plan.priceNote}</span> : null}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** "Antes de registrarte": las preguntas (y el `FAQPage` de la página). */
export function SumateFaq() {
  const { faq } = sumate;
  return (
    <Section tone="canvas" spacing="md" aria-labelledby="sumate-faq">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-2 lg:col-span-4">
          <h2 id="sumate-faq" className={sectionTitle}>
            {faq.title}
          </h2>
          <p className="text-base text-fg-muted">
            {faq.helpPrefix}{" "}
            <a
              href={whatsappUrl(faq.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
              data-analytics-placement="registro_faq"
              className={textLink}
            >
              {faq.helpCta}
              <span className="sr-only"> {siteContent.nav.externalHint}</span>
            </a>
            .
          </p>
        </div>
        <div className="lg:col-span-8">
          <FaqAccordion items={faq.items} />
        </div>
      </div>
    </Section>
  );
}

/**
 * Barra fija inferior en celular: "Registrar mi negocio" + "Precios". Sin JS
 * (Server Component), debajo de `lg`, después del pie (no lo tapa nunca).
 */
export function SumateMobileBar() {
  const { mobileBar } = sumate;
  return (
    <div
      role="region"
      aria-label={mobileBar.label}
      // Mismo gutter y área segura que `MobileActionBar` (valores arbitrarios
      // a propósito: el 6% es el del `Container` y `env()` no tiene clase).
      className="sticky bottom-0 z-40 flex gap-2.5 border-t border-control-line bg-card px-[6%] pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:hidden"
    >
      <RegisterLink placement="registro_barra" className="flex-1">
        {mobileBar.primary}
      </RegisterLink>
      <ButtonLink href={PROVEEDORES_PLANES_PATH} variant="outline" size="52" className="flex-1">
        {mobileBar.secondary}
      </ButtonLink>
    </div>
  );
}
