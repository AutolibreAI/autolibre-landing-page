import Image from "next/image";
import { QrCode } from "@/components/ui/qr-code";
import { StoreLinks } from "@/components/ui/store-links";
import { DOWNLOAD_SECTIONS, type QuoteModulePlacement } from "@/lib/analytics/events";
import { APP_VINCULADA, moduloPedidoContent } from "@/lib/content/modulo-pedido";

const copy = moduloPedidoContent.taller.appPromo;

type ModuloAppPromoProps = {
  /** Dónde está montado el módulo: viaja como `placement` en los clicks a tienda. */
  readonly placement: QuoteModulePlacement;
  /** Nivel del título del bloque: uno debajo del título del enviado. */
  readonly headingLevel: "h3" | "h4";
};

/**
 * Bloque "Así se ve en la app" del estado enviado del módulo de pedido
 * (ajuste del 2026-11-24): tres pasos con capturas reales de la app, la
 * descarga (QR a `/descarga` con UTM desde `lg`, más los botones de tienda)
 * y la salida por WhatsApp.
 *
 * Server Component. Se arma en el server y llega a `ModuloForm` como prop
 * `ReactNode`: la isla solo lo monta al enviar. Así no suma JS, el QR es un
 * SVG fijo (`QrCode`, generado una vez fuera del proyecto) y las capturas
 * (`next/image`, `loading="lazy"`) no se piden hasta que el bloque existe en
 * el DOM: no tocan el LCP ni el CLS de la carga.
 *
 * Copy honesto: con `APP_VINCULADA` apagado no dice que este pedido ya está
 * en la app (los pedidos de la web todavía no quedan en ninguna cuenta).
 */
export function ModuloAppPromo({ placement, headingLevel: Heading }: ModuloAppPromoProps) {
  const text = APP_VINCULADA ? copy.linked : copy.unlinked;
  const { download } = copy;

  return (
    <div className="border-t border-card-line bg-canvas p-5 md:p-8">
      <p className="text-sm font-semibold text-brand-hover">{text.eyebrow}</p>
      <Heading className="mt-1.5 font-display text-xl leading-tight font-bold text-fg md:text-2xl">
        {text.title}
      </Heading>
      <p className="mt-1.5 max-w-140 text-base text-fg-muted">{text.body}</p>

      {/* Fila con scroll horizontal y `scroll-snap` en celular; en la compu
          entran los tres. `tabIndex` para poder scrollearla con las flechas
          (Safari no enfoca solo los contenedores con scroll). Sin
          `scroll-behavior: smooth`: respeta `prefers-reduced-motion`. */}
      <ol
        aria-label={copy.stepsLabel}
        tabIndex={0}
        className="mt-5.5 flex snap-x snap-mandatory list-none gap-5 overflow-x-auto pb-1"
      >
        {copy.steps.map((step, index) => (
          <li key={step.title} className="flex w-60 shrink-0 snap-start flex-col gap-3">
            {/* Marco de teléfono recortado (la pantalla sigue hacia abajo).
                Alto fijo: el lugar está reservado antes de que baje la
                captura, no hay salto. */}
            <div className="h-75 overflow-clip rounded-t-3xl border-6 border-b-0 border-ink bg-canvas">
              <Image
                src={step.screen.src}
                alt=""
                width={step.screen.width}
                height={step.screen.height}
                loading="lazy"
                // 240 de la tarjeta menos los dos bordes de 6.
                sizes="228px"
                className="block h-auto w-full"
              />
            </div>
            <div className="flex gap-2.5">
              <span
                aria-hidden="true"
                className="flex size-6.5 shrink-0 items-center justify-center rounded-full border border-ink font-display text-label font-bold text-fg"
              >
                {index + 1}
              </span>
              <div>
                <p className="mt-0.5 font-display text-lead leading-tight font-semibold text-fg">
                  {step.title}
                </p>
                <p className="mt-1 text-sm text-fg-muted">{step.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-control-line pt-5">
        {/* QR solo desde `lg`, como en `/descarga`: en el celular no sirve.
            144 px para 45 módulos (37 + zona de silencio): 3,2 px por módulo.
            `data-qr-view`: lo observa `ModuloForm` para mandar `qr_view`. */}
        <div data-qr-view="" className="hidden shrink-0 rounded-card bg-card p-2.5 lg:block">
          <QrCode code="pedidoEnviado" title={download.qrAlt} className="size-36 text-fg" />
        </div>
        <div className="min-w-0 flex-1 basis-65">
          <p className="font-display text-lg font-semibold text-fg">{download.title}</p>
          <p className="mt-1 hidden text-control text-fg-muted lg:block">{download.scan}</p>
          <p className="mt-1 text-control text-fg-muted">{text.next}</p>
        </div>
        <StoreLinks
          placement={placement}
          section={DOWNLOAD_SECTIONS.pedidoEnviado}
          platformAware
        />
      </div>

      <p className="mt-4 text-sm text-fg-muted">{copy.whatsappFallback}</p>
    </div>
  );
}
