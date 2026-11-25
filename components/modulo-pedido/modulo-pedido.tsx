import Image from "next/image";
import Link from "next/link";
import { ButtonAnchor } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  ANALYTICS_EVENTS,
  LEAD_SOURCES,
  QUOTE_MODULE_PLACEMENTS,
  QUOTE_TABS,
  type QuoteModulePlacement,
  type QuoteTab,
} from "@/lib/analytics/events";
import { APP_VINCULADA, moduloPedidoContent } from "@/lib/content/modulo-pedido";
import { siteContent } from "@/lib/content/site";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";
import { ModuloAppPromo } from "./modulo-app-promo";
import { ModuloForm } from "./modulo-form";
import { ModuloTabs } from "./modulo-tabs";

const copy = moduloPedidoContent;

type ModuloPedidoProps = {
  /** Dónde está montado: viaja como `placement` en todos sus eventos. */
  readonly placement: QuoteModulePlacement;
  /**
   * Nivel de los títulos de los paneles (y del paso 2 y del enviado). Lo
   * decide la página según su outline: `h2` si el módulo cuelga del `h1`.
   */
  readonly headingLevel?: "h2" | "h3";
  /** Prefijo de los ids. Default: el `placement`. */
  readonly idPrefix?: string;
  readonly className?: string;
};

/**
 * Módulo de pedido (rediseño 2026-11, fase 3): pestañas Taller / Auxilio /
 * Multas (sin Seguro desde el 2026-11-24, decisión de producto), la barra "¿Qué le pasa?" + "¿Dónde estás?" + "Pedir
 * propuestas", los chips de "Lo más pedido" y, en un segundo paso, WhatsApp
 * y patente. Lo montan el Home y `/pedido`.
 *
 * Server Component. Todo lo que se lee (pestañas, labels, chips, paneles de
 * los aliados, WhatsApp) sale en el HTML del server; los íconos son
 * `next/image` renderizados acá. Islas de cliente, dos y hoja:
 *
 * - `ModuloTabs`: qué pestaña está elegida (recibe íconos y paneles hechos).
 * - `ModuloForm`: el form de Taller (estado, validación, Places, envío).
 *   El bloque de la app del enviado (`ModuloAppPromo`: capturas, QR,
 *   tiendas) se arma acá y la isla solo lo monta al enviar.
 *
 * Mapeo con el backend: solo Taller registra un pedido (`/api/presupuesto`).
 * Auxilio y Multas llevan a los aliados del Home (Asistir24 y Sin
 * Fotomultas).
 */
export function ModuloPedido({
  placement,
  headingLevel = "h2",
  idPrefix = placement,
  className,
}: ModuloPedidoProps) {
  const Heading = headingLevel;
  const taller = copy.taller;
  // Igual que los WhatsApp de `/pedido`: abrir el chat ahí es la conversión
  // de la campaña (`Lead`); en el resto del sitio es un `Contact`.
  const leadSource =
    placement === QUOTE_MODULE_PLACEMENTS.pedido ? LEAD_SOURCES.whatsapp : undefined;

  const whatsappProps = (tab: QuoteTab) => ({
    target: "_blank",
    rel: "noopener noreferrer",
    "data-analytics-event": ANALYTICS_EVENTS.whatsappClicked,
    "data-analytics-placement": placement,
    "data-analytics-tab": tab,
    "data-analytics-lead-source": leadSource,
  });

  const externalHint = <span className="sr-only"> {siteContent.nav.externalHint}</span>;

  /** Panel de una pestaña sin form: título, bajada y un CTA que sale del sitio. */
  function partnerPanel(
    tab: QuoteTab,
    panel: { title: string; body: string; cta: { label: string; href: string } },
    ctaProps: Record<string, string | undefined>,
  ) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-panel border border-control-line bg-card p-5 text-left md:p-7">
        <div className="min-w-0 flex-1 basis-80">
          <Heading className="font-display text-xl font-bold text-fg md:text-2xl">
            {panel.title}
          </Heading>
          <p className="mt-1 text-base text-fg-muted">{panel.body}</p>
        </div>
        <ButtonAnchor
          href={panel.cta.href}
          variant="primary"
          size="56"
          className="max-sm:w-full max-sm:whitespace-normal"
          {...ctaProps}
        >
          {panel.cta.label}
          {externalHint}
        </ButtonAnchor>
      </div>
    );
  }

  const partnerCtaProps = (tab: QuoteTab) => ({
    target: "_blank",
    rel: "noopener noreferrer",
    "data-analytics-event": ANALYTICS_EVENTS.quotePartnerClicked,
    "data-analytics-placement": placement,
    "data-analytics-tab": tab,
  });

  const tallerPanel = (
    <ModuloForm
      idPrefix={idPrefix}
      placement={placement}
      headingLevel={headingLevel}
      copy={{
        problema: taller.problema,
        zona: taller.zona,
        next: taller.next,
        chipsLabel: taller.chips.label,
        contact: taller.contact,
        sent: taller.sent,
      }}
      chips={taller.chips.items.map((chip) => ({
        id: chip.id,
        label: chip.label,
        // `key`: el elemento viaja dentro de un array de props hacia la isla
        // client y React (RSC) lo valida como hijo de una lista.
        icon: (
          <Image
            key={chip.id}
            src={chip.icon.src}
            alt=""
            width={chip.icon.width}
            height={chip.icon.height}
            sizes="28px"
            className="size-7 shrink-0"
          />
        ),
      }))}
      whatsapp={
        <p className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2 text-control text-fg-muted">
          {taller.whatsapp.prompt}
          <ButtonAnchor
            href={whatsappUrl(taller.whatsapp.text)}
            variant="outline"
            size="44"
            {...whatsappProps(QUOTE_TABS.taller)}
          >
            <Icon name="whatsapp" size={20} strokeWidth={1.8} className="text-status-ok" />
            {taller.whatsapp.label}
            {externalHint}
          </ButtonAnchor>
        </p>
      }
      consentLinks={{
        // En otra pestaña: salir de acá perdería lo que la persona cargó.
        terms: (
          <Link
            href="/terminos"
            target="_blank"
            className="font-semibold text-fg underline underline-offset-4 hover:text-brand-hover"
          >
            {taller.contact.consent.termsLink}
            {externalHint}
          </Link>
        ),
        privacy: (
          <Link
            href="/privacidad"
            target="_blank"
            className="font-semibold text-fg underline underline-offset-4 hover:text-brand-hover"
          >
            {taller.contact.consent.privacyLink}
            {externalHint}
          </Link>
        ),
      }}
      sentIcon={
        <span
          aria-hidden="true"
          className="flex size-13 shrink-0 items-center justify-center rounded-full bg-brand-50 text-action"
        >
          <Icon name="check" size={26} strokeWidth={2.4} />
        </span>
      }
      appLinked={APP_VINCULADA}
      appPromo={
        <ModuloAppPromo
          placement={placement}
          headingLevel={headingLevel === "h2" ? "h3" : "h4"}
        />
      }
    />
  );

  const panels: Record<QuoteTab, React.ReactNode> = {
    taller: tallerPanel,
    auxilio: partnerPanel(QUOTE_TABS.auxilio, copy.auxilio, partnerCtaProps(QUOTE_TABS.auxilio)),
    multas: partnerPanel(QUOTE_TABS.multas, copy.multas, partnerCtaProps(QUOTE_TABS.multas)),
  };

  return (
    <div className={cn("w-full text-left", className)}>
      <ModuloTabs
        idPrefix={idPrefix}
        label={copy.tablistLabel}
        placement={placement}
        tabs={copy.tabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: (
            <Image
              key={tab.id}
              src={tab.icon.src}
              alt=""
              width={tab.icon.width}
              height={tab.icon.height}
              sizes="52px"
              className="size-13"
            />
          ),
          panel: panels[tab.id],
        }))}
      />
    </div>
  );
}
