import Image from "next/image";
import Link from "next/link";
import { FlowSteps, type FlowStep } from "@/components/proveedores/flow/flow-steps";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { siteContent } from "@/lib/content/site";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

const { flowHeader } = partnerAccountContent;

type FlowShellProps = {
  /** Pasos del flujo en el centro del encabezado (solo desde `lg`). */
  readonly steps?: {
    readonly label: string;
    readonly items: readonly FlowStep[];
    readonly current: number;
  };
  /**
   * Barra de avance debajo del encabezado (el alta en pasos): `current` de
   * `total` segmentos llenos. Decorativa: el paso también va en texto.
   */
  readonly progress?: { readonly current: number; readonly total: number };
  /** Mensaje precargado del "¿Dudas? Escribinos". */
  readonly helpMessage: string;
  /** `data-analytics-placement` del WhatsApp de ayuda. */
  readonly helpPlacement: string;
  /** "Salir": solo con sesión (lo resuelve la isla, que tiene Clerk). */
  readonly signOut?: { readonly onClick: () => void; readonly pending: boolean } | null;
  /**
   * `false`: sin landmarks (`<div>` en lugar de `<header>` y `<main>`). Lo
   * usa el "cargando" del alta, que convive en el HTML con la landing (que ya
   * tiene su `<header>` y su `<main>`).
   */
  readonly landmarks?: boolean;
  readonly children: React.ReactNode;
};

const headerLink =
  "inline-flex min-h-11 items-center gap-2 text-control font-medium text-fg transition-colors hover:text-brand-hover motion-reduce:transition-none";

/**
 * Armazón de foco de los flujos privados de negocios (contratar, su
 * resultado, reclamar y el alta), lienzos `Contratar*`, `Reclamar*` y `Alta`:
 * un encabezado mínimo (logo, pasos, "¿Dudas? Escribinos" y "Salir") y el
 * `<main>`, sin el menú del sitio ni el pie. Quien está pagando o cargando su
 * negocio no necesita el directorio ni el blog a mano: lo distrae.
 *
 * Sin estado ni hooks: lo renderizan las islas de cada flujo (que saben en
 * qué paso están y si hay sesión). En el HTML del server sale el estado
 * inicial de la isla, con su `<h1>`.
 */
export function FlowShell({
  steps,
  progress,
  helpMessage,
  helpPlacement,
  signOut,
  landmarks = true,
  children,
}: FlowShellProps) {
  const Header = landmarks ? "header" : "div";
  const Main = landmarks ? "main" : "div";
  return (
    <div className="flex min-h-dvh flex-col">
      <Header className="sticky top-0 z-50 border-b border-card-line bg-card">
        <Container size="wide" className="flex h-17 items-center gap-6">
          <Link href="/" aria-label={flowHeader.home} className="flex shrink-0">
            <Image
              src="/brand/lockup-light.png"
              alt="AutoLibre.AI"
              width={676}
              height={132}
              loading="eager"
              sizes="133px"
              className="h-6.5 w-auto"
            />
          </Link>

          {steps ? (
            <div className="hidden min-w-0 flex-1 justify-center lg:flex">
              <FlowSteps label={steps.label} steps={steps.items} current={steps.current} />
            </div>
          ) : null}

          <div className="ml-auto flex items-center gap-5">
            <a
              href={whatsappUrl(helpMessage)}
              target="_blank"
              rel="noopener noreferrer"
              data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
              data-analytics-placement={helpPlacement}
              className={headerLink}
            >
              <Icon name="chat" size={20} strokeWidth={1.8} className="text-brand-hover" />
              <span className="lg:hidden">{flowHeader.helpShort}</span>
              <span className="max-lg:hidden">{flowHeader.help}</span>
              <span className="sr-only"> {siteContent.nav.externalHint}</span>
            </a>
            {signOut ? (
              <button
                type="button"
                onClick={signOut.onClick}
                disabled={signOut.pending}
                className="inline-flex min-h-11 items-center text-control font-medium text-fg-muted underline underline-offset-4 transition-colors hover:text-fg disabled:cursor-wait motion-reduce:transition-none"
              >
                {signOut.pending ? flowHeader.signingOut : flowHeader.signOut}
              </button>
            ) : null}
          </div>
        </Container>
        {progress ? (
          <div aria-hidden="true" className="flex gap-1">
            {Array.from({ length: progress.total }, (_, index) => (
              <span
                key={index}
                className={cn("h-1 flex-1", index < progress.current ? "bg-action" : "bg-card-line")}
              />
            ))}
          </div>
        ) : null}
      </Header>
      <Main className="flex-1 bg-card">{children}</Main>
    </div>
  );
}

/**
 * Columna del contenido de un flujo: el mismo borde que el encabezado
 * (`Container` ancho) y el aire de arriba y abajo del lienzo.
 */
export function FlowMain({
  children,
  size = "wide",
  className,
}: {
  readonly children: React.ReactNode;
  readonly size?: "wide" | "narrow";
  readonly className?: string;
}) {
  return (
    <div className="py-10 md:py-16">
      <Container size={size === "wide" ? "wide" : "narrow"} className={className}>
        {children}
      </Container>
    </div>
  );
}
