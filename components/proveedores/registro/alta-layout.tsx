"use client";

import { useEffect, useRef } from "react";
import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { FlowSteps } from "@/components/proveedores/flow/flow-steps";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { providersContent } from "@/lib/content/providers";

const { flow } = providersContent;

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
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <aside aria-label={flow.sidebar.label} className="hidden lg:col-span-3 lg:flex lg:flex-col lg:gap-6">
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

      <div className="flex min-w-0 flex-col gap-10 lg:col-span-7 lg:col-start-5">
        {done ? null : (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-brand-hover">{flow.progressLabel(step + 1, totalSteps)}</p>
            <h1
              id={PRIVATE_FLOW_TITLE_ID}
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-4xl font-bold tracking-tight text-balance text-fg md:text-5xl"
            >
              {head.title}
            </h1>
            <p className="text-lead text-fg-muted md:text-lead-lg">{head.intro}</p>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
