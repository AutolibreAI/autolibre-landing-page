import Link from "next/link";
import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { siteContent } from "@/lib/content/site";
import { cn } from "@/lib/utils";

/**
 * Piezas de los estados finales de los flujos de negocios (lienzos
 * `ContratarListo`, `ContratarPendiente`, `ContratarConfirmando` y
 * `ReclamarListo`): columna centrada de 640px, título grande y tarjetas de
 * "Próximos pasos". Sin estado: las usan las islas.
 */

/** Ícono + `<h1>` + bajada de un resultado. El foco va al título al aparecer. */
export function SuccessHead({
  headingRef,
  title,
  body,
  icon = "check",
}: {
  readonly headingRef?: React.Ref<HTMLHeadingElement>;
  readonly title: string;
  readonly body?: React.ReactNode;
  /** `check`: salió; `none`: sin ícono (resultado sin confirmar). */
  readonly icon?: "check" | "none";
}) {
  return (
    <div className="flex flex-col items-start gap-4">
      {icon === "check" ? (
        <span aria-hidden="true" className="flex size-13 items-center justify-center rounded-full bg-brand-50 text-fg">
          <Icon name="check" size={22} strokeWidth={2.4} />
        </span>
      ) : null}
      <div className="flex flex-col gap-2">
        <h1
          id={PRIVATE_FLOW_TITLE_ID}
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-4xl font-bold tracking-tight text-balance text-fg md:text-5xl"
        >
          {title}
        </h1>
        {body ? <p className="text-lead text-fg-muted md:text-lead-lg">{body}</p> : null}
      </div>
    </div>
  );
}

export type StepAction =
  | { readonly kind: "link"; readonly href: string; readonly label: string; readonly primary: boolean }
  | {
      readonly kind: "external";
      readonly href: string;
      readonly label: string;
      readonly primary: boolean;
      readonly analytics?: Readonly<Record<`data-${string}`, string>>;
      readonly icon?: "chat";
    }
  | { readonly kind: "button"; readonly onClick: () => void; readonly label: string; readonly primary: boolean };

/** El botón de una tarjeta o de un estado. Links a pantallas privadas, sin prefetch. */
export function StepActionButton({ action, block = false }: { readonly action: StepAction; readonly block?: boolean }) {
  const className = cn(
    buttonVariants({ variant: action.primary ? "primary" : "outline", size: "48", block }),
    "shrink-0",
  );
  if (action.kind === "button") {
    return (
      <button type="button" onClick={action.onClick} className={className}>
        {action.label}
      </button>
    );
  }
  if (action.kind === "external") {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={className} {...action.analytics}>
        {action.icon ? <Icon name={action.icon} size={18} strokeWidth={1.8} className="text-brand-hover" /> : null}
        {action.label}
        <span className="sr-only"> {siteContent.nav.externalHint}</span>
      </a>
    );
  }
  return (
    <Link href={action.href} prefetch={false} className={className}>
      {action.label}
    </Link>
  );
}

/** Tarjeta de "Próximos pasos": título, texto y una acción a la derecha (abajo en celular). */
export function NextStepCard({
  title,
  body,
  action,
}: {
  readonly title: string;
  readonly body: string;
  readonly action: StepAction;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-card-line bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-semibold text-fg">{title}</h2>
        <p className="text-base text-fg-muted">{body}</p>
      </div>
      <StepActionButton action={action} />
    </div>
  );
}
