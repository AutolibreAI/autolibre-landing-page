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
import {
  APP_VINCULADA,
  moduloPedidoContent,
  type ConsultaContent,
} from "@/lib/content/modulo-pedido";
import { INQUIRY_KINDS, type InquiryTab } from "@/lib/consulta-inquiry";
import { requestFlowContent } from "@/lib/content/request-flow";
import { siteContent } from "@/lib/content/site";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";
import { ModuloAppPromo } from "./modulo-app-promo";
import { ModuloConsultaForm } from "./modulo-consulta-form";
import { ModuloForm } from "./modulo-form";
import { ModuloTabs } from "./modulo-tabs";

const copy = moduloPedidoContent;

type ModuloPedidoProps = {
  /** Dónde está montado: viaja como `placement` en todos sus eventos. */
  readonly placement: QuoteModulePlacement;
  /**
   * Nivel de los títulos de los paneles de Auxilio, Multas, Seguros y
   * Financiación. Lo decide la
   * página según su outline: `h2` si el módulo cuelga del `h1`. (El resto
   * del pedido pasa en la pantalla limpia, con su propio `h2`.)
   */
  readonly headingLevel?: "h2" | "h3";
  /** Prefijo de los ids. Default: el `placement`. */
  readonly idPrefix?: string;
  readonly className?: string;
};

/**
 * Módulo de pedido (rediseño 2026-11, fase 3): pestañas Taller / Auxilio /
 * Multas / Seguros / Financiación (las dos últimas desde el 2026-11-27), la
 * barra "¿Qué le pasa?" + "¿Dónde estás?" + "Pedir
 * propuestas", los chips de "Lo más pedido" y, al pedir, la pantalla limpia
 * con el resto del pedido (`RequestFlowOverlay`). Lo montan el Home y `/pedido`.
 *
 * Server Component. Todo lo que se lee (pestañas, labels, chips, paneles de
 * los aliados, WhatsApp) sale en el HTML del server; los íconos son
 * `next/image` renderizados acá. Islas de cliente, tres y hoja:
 *
 * - `ModuloTabs`: qué pestaña está elegida (recibe íconos y paneles hechos).
 * - `ModuloForm`: el form de Taller (estado, validación, Places, envío). El
 *   paso final es la pantalla limpia `RequestFlowOverlay`.
 *   El bloque de la app de la confirmación (`ModuloAppPromo`: capturas, QR,
 *   tiendas) se arma acá y la isla solo lo monta al enviar.
 * - `ModuloConsultaForm`: el form de Seguros y el de Financiación (una
 *   instancia por pestaña; el título y la bajada del panel salen de acá).
 *
 * Mapeo con el backend: solo Taller registra un pedido (`/api/presupuesto`).
 * Auxilio y Multas llevan a los aliados del Home (Asistir24 y Sin
 * Fotomultas). Seguros y Financiación se envían por formulario y se
 * registran en el backend por `/api/consulta` (ver
 * `modulo-consulta-form.tsx` y `lib/consulta-inquiry.ts`).
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

  /**
   * Panel de una pestaña sin form: título, bajada y un CTA que sale del sitio.
   * `whatsapp`: el CTA abre un chat (Auxilio → Asistir24), así que lleva la
   * variante y el ícono de WhatsApp, igual que el de Taller.
   */
  function partnerPanel(
    panel: { title: string; body: string; cta: { label: string; href: string } },
    ctaProps: Record<string, string | undefined>,
    { whatsapp = false }: { whatsapp?: boolean } = {},
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
          variant={whatsapp ? "whatsapp" : "primary"}
          size="56"
          className="max-sm:w-full max-sm:whitespace-normal"
          {...ctaProps}
        >
          {whatsapp && <Icon name="whatsapp" size={22} strokeWidth={1.8} />}
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

  /**
   * Panel de una pestaña de consulta (Seguros, Financiación): título y bajada
   * en el server, y el form como isla hoja. A la isla le llegan datos y un
   * solo elemento como prop: el link a `/privacidad` del consentimiento.
   */
  function consultaPanel(tab: InquiryTab, panel: ConsultaContent) {
    // El título y la bajada se quedan en el server; a la isla va el resto.
    const { title, body, ...formCopy } = panel;
    return (
      <div className="flex flex-col gap-5 rounded-panel border border-control-line bg-card p-5 text-left md:p-7">
        <div>
          <Heading className="font-display text-xl font-bold text-fg md:text-2xl">
            {title}
          </Heading>
          <p className="mt-1 text-base text-fg-muted">{body}</p>
        </div>
        <ModuloConsultaForm
          idPrefix={idPrefix}
          tab={tab}
          placement={placement}
          kind={INQUIRY_KINDS[tab]}
          copy={formCopy}
          // `key`: slot que la isla monta entre hermanos (ver AGENTS.md, "Slots").
          // En otra pestaña: salir de acá perdería lo que la persona cargó.
          privacyLink={
            <Link
              key="privacy"
              href="/privacidad"
              target="_blank"
              className="font-semibold text-fg underline underline-offset-4 hover:text-brand-hover"
            >
              {panel.consent.privacyLink}
              {externalHint}
            </Link>
          }
          whatsappBase={whatsappUrl("")}
          externalHint={siteContent.nav.externalHint}
          leadSource={leadSource}
        />
      </div>
    );
  }

  // Todo elemento que viaja como prop a `ModuloForm` lleva `key`: la isla los
  // monta entre hermanos y RSC los valida como hijos de una lista (ver
  // AGENTS.md, "Slots de Server a Client").
  const tallerPanel = (
    <ModuloForm
      idPrefix={idPrefix}
      placement={placement}
      copy={{
        problema: taller.problema,
        zona: taller.zona,
        next: taller.next,
        chipsLabel: taller.chips.label,
        contact: taller.contact,
        sent: taller.sent,
        requestFlow: requestFlowContent,
      }}
      chips={taller.chips.items.map((chip) => ({
        id: chip.id,
        label: chip.label,
        // `key`: slot que la isla monta entre hermanos (ver AGENTS.md, "Slots").
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
        <p key="whatsapp" className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2 text-control text-fg-muted">
          {taller.whatsapp.prompt}
          <ButtonAnchor
            href={whatsappUrl(taller.whatsapp.text)}
            variant="whatsapp"
            size="44"
            {...whatsappProps(QUOTE_TABS.taller)}
          >
            <Icon name="whatsapp" size={20} strokeWidth={1.8} />
            {taller.whatsapp.label}
            {externalHint}
          </ButtonAnchor>
        </p>
      }
      consentLinks={{
        // En otra pestaña: salir de acá perdería lo que la persona cargó.
        terms: (
          <Link
            key="terms"
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
            key="privacy"
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
          key="sent-icon"
          aria-hidden="true"
          className="flex size-13 shrink-0 items-center justify-center rounded-full bg-brand-50 text-action"
        >
          <Icon name="check" size={26} strokeWidth={2.4} />
        </span>
      }
      appLinked={APP_VINCULADA}
      appPromo={
        <ModuloAppPromo
          key="app-promo"
          placement={placement}
          // Cuelga del `h2` de la confirmación, en la pantalla limpia.
          headingLevel="h3"
        />
      }
    />
  );

  const panels: Record<QuoteTab, React.ReactNode> = {
    taller: tallerPanel,
    auxilio: partnerPanel(copy.auxilio, partnerCtaProps(QUOTE_TABS.auxilio), { whatsapp: true }),
    multas: partnerPanel(copy.multas, partnerCtaProps(QUOTE_TABS.multas)),
    seguros: consultaPanel(QUOTE_TABS.seguros, copy.seguros),
    financiacion: consultaPanel(QUOTE_TABS.financiacion, copy.financiacion),
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
          // `key`: slot que la isla monta entre hermanos (ver AGENTS.md, "Slots").
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
