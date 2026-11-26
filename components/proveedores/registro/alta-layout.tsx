"use client";

import { useEffect, useRef } from "react";
import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { FlowSteps } from "@/components/proveedores/flow/flow-steps";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { providersContent } from "@/lib/content/providers";
import { cn } from "@/lib/utils";

const { flow } = providersContent;

/**
 * Grilla del alta: columna de pasos (desde `lg`, fija al scrollear) y la
 * columna del formulario. La comparte el esqueleto de "buscando tu negocio"
 * para que el paso al formulario no corra nada de lugar.
 */
const altaGrid = "grid gap-8 lg:grid-cols-12 lg:gap-12";
const altaAside = "hidden lg:sticky lg:top-24 lg:col-span-3 lg:flex lg:flex-col lg:gap-5 lg:self-start";
const altaColumn = "flex min-w-0 flex-col lg:col-span-7 lg:col-start-5";

type AltaLayoutProps = {
  /** Paso del formulario a la vista (0 a 2). */
  readonly step: number;
  readonly totalSteps: number;
  /** La solicitud ya salió: la columna marca "Revisión" y no hay título de paso. */
  readonly done: boolean;
  /** Con qué cuenta se registra (email o nombre). */
  readonly accountName: string | null;
  readonly onSwitchAccount: () => void;
  readonly switching: boolean;
  /** El formulario (o la pantalla de estado). */
  readonly children: React.ReactNode;
};

/**
 * Armazón del alta en pasos (lienzo `Alta`): a la izquierda, desde `lg`, la
 * columna de pasos (la cuenta ya hecha, los tres del formulario y la
 * revisión) con la cuenta en uso; a la derecha, "Paso n de 3", el `<h1>` del
 * paso, su bajada y el formulario. En celular solo la columna del
 * formulario (la barra de avance va en el encabezado).
 *
 * Al cambiar de paso el foco va al `<h1>` y la pantalla vuelve arriba: el
 * contenido cambió entero y el lector arranca desde el título nuevo.
 */
export function AltaLayout({
  step,
  totalSteps,
  done,
  accountName,
  onSwitchAccount,
  switching,
  children,
}: AltaLayoutProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const head = flow.stepHeads[step] ?? flow.stepHeads[0];
  // Columna: 0 = cuenta (hecha), 1..3 = pasos del formulario, 4 = revisión.
  const sidebarCurrent = done ? flow.sidebar.items.length - 1 : step + 1;

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (done) return;
    window.scrollTo({ top: 0 });
    headingRef.current?.focus();
  }, [step, done]);

  return (
    <div className={altaGrid}>
      <aside aria-label={flow.sidebar.label} className={altaAside}>
        <p className="text-sm font-semibold text-fg">{flow.sidebar.title}</p>
        <FlowSteps
          orientation="vertical"
          label={flow.sidebar.label}
          steps={flow.sidebar.items}
          current={sidebarCurrent}
        />
        {accountName ? (
          <p className="flex flex-col gap-0.5 border-t border-card-line pt-5 text-sm text-fg-muted">
            <span>{flow.session.signedInAs}</span>
            <strong className="truncate font-semibold text-fg">{accountName}</strong>
            <button
              type="button"
              onClick={onSwitchAccount}
              disabled={switching}
              className="mt-1 inline-flex min-h-11 items-center self-start font-semibold text-fg underline underline-offset-4 disabled:cursor-wait"
            >
              {switching ? partnerAccountContent.flowHeader.signingOut : flow.session.switchAccount}
            </button>
          </p>
        ) : null}
      </aside>

      <div className={cn(altaColumn, done ? "gap-8" : "gap-6 md:gap-8")}>
        {done ? null : (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold text-brand-hover">{flow.progressLabel(step + 1, totalSteps)}</p>
            <h1
              id={PRIVATE_FLOW_TITLE_ID}
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-3xl font-bold tracking-tight text-balance text-fg md:text-4xl"
            >
              {head.title}
            </h1>
            <p className="text-base text-fg-muted md:text-lead">{head.intro}</p>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/** Barra gris del esqueleto (sin animación: es un instante y no distrae). */
function Bar({ className }: { readonly className: string }) {
  return <span aria-hidden="true" className={cn("block rounded-full bg-canvas", className)} />;
}

/**
 * "Buscando tu negocio…" (con sesión, mientras se consulta si la cuenta ya
 * tiene un negocio): el esqueleto del paso 1 con la MISMA grilla que
 * `AltaLayout`, así lo que llega después (casi siempre el formulario) aparece
 * en su lugar y no se ve una línea de texto suelta. El texto va para lectores
 * de pantalla (`role="status"`).
 */
export function AltaSkeleton() {
  return (
    <div role="status" className={altaGrid}>
      <span className="sr-only">{flow.checking}</span>
      <div aria-hidden="true" className={altaAside}>
        <Bar className="h-4 w-36" />
        {flow.sidebar.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3.5">
            <span className="size-6 shrink-0 rounded-full bg-canvas" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Bar className="h-3.5 w-28" />
              <Bar className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
      <div aria-hidden="true" className={cn(altaColumn, "gap-6 md:gap-8")}>
        <div className="flex flex-col gap-3">
          <Bar className="h-4 w-20" />
          <Bar className="h-9 w-3/4 max-w-96" />
          <Bar className="h-4 w-full max-w-120" />
        </div>
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex flex-col gap-3">
            <Bar className="h-5 w-52" />
            <Bar className="h-12 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
