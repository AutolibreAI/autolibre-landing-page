import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StoreLinks } from "@/components/ui/store-links";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { PRESUPUESTO_WHATSAPP_URL } from "./use-quote-flow";

const copy = presupuestoContent.modal;

type QuoteSuccessProps = {
  readonly variant: "modal" | "page";
  readonly onClose?: () => void;
};

export function QuoteSuccess({ variant, onClose }: QuoteSuccessProps) {
  return variant === "page" ? <SuccessPage /> : <SuccessModal onClose={onClose} />;
}

/** Confirmación efímera: se lee, se cierra, se vuelve a lo que se estaba haciendo. */
function SuccessModal({ onClose }: { readonly onClose?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon name="check" size={22} />
      </span>
      <p className="font-display text-lg font-bold text-ink">{copy.success.title}</p>
      <p className="max-w-[34ch] text-sm leading-relaxed text-ink/65">
        {copy.success.description}
      </p>
      <div className="mt-3 w-full border-t border-line pt-4">
        <p className="text-xs text-ink/65">{copy.success.whatsappFallback}</p>
        <a
          href={PRESUPUESTO_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-semibold text-brand hover:text-brand-hover"
        >
          {copy.success.whatsappLinkLabel}
        </a>
      </div>
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onClose}>
        {copy.success.closeLabel}
      </Button>
    </div>
  );
}

/**
 * La misma confirmación, pero persistente: acá no hay un "cerrar" que
 * devuelva a la página anterior, así que la pantalla tiene que sostenerse
 * sola — contar qué pasa ahora, dar el próximo paso (la app) y recién después
 * una salida.
 */
function SuccessPage() {
  const page = presupuestoContent.successPage;

  return (
    <div role="status" className="flex flex-col">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon name="check" size={26} />
      </span>

      <h2 className="mt-5 font-display text-[1.75rem] font-bold text-ink">
        {page.title}
      </h2>
      <p className="mt-2 max-w-[46ch] text-[0.9375rem] text-ink/65">
        {page.description}
      </p>

      <p className="mt-9 font-display text-sm font-bold text-ink">
        {page.timelineTitle}
      </p>
      <ol className="mt-4 flex flex-col">
        {page.timeline.map((entry, index) => {
          const isLast = index === page.timeline.length - 1;
          return (
            <li key={entry.title} className="flex gap-4">
              {/* El hilo entre los círculos es lo que convierte tres filas en
                  una secuencia; sin él son tres ítems sueltos. */}
              <div className="flex flex-col items-center">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-brand">
                  <Icon name={entry.icon} size={18} />
                </span>
                {isLast ? null : (
                  <span className="w-px flex-1 bg-brand/25" aria-hidden="true" />
                )}
              </div>
              <div className={isLast ? "pt-1.5" : "pt-1.5 pb-6"}>
                <p className="text-[0.9375rem] font-semibold text-ink">{entry.title}</p>
                <p className="mt-0.5 text-sm text-ink/65">{entry.body}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 rounded-card border border-line bg-surface-subtle p-6">
        <p className="font-display text-lg font-bold text-ink">{page.app.title}</p>
        <ul className="mt-4 flex flex-col gap-2.5">
          {page.app.items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-ink/70">
              <Icon name="check" size={18} className="mt-px shrink-0 text-brand" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <StoreLinks tone="light" className="mt-6" />
      </div>

      <div className="mt-8 border-t border-line pt-5">
        <p className="text-xs text-ink/65">{copy.success.whatsappFallback}</p>
        <a
          href={PRESUPUESTO_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-sm font-semibold text-brand hover:text-brand-hover"
        >
          {copy.success.whatsappLinkLabel}
        </a>
      </div>

      <Link
        href="/"
        className="mt-8 self-start text-sm font-medium text-ink/65 transition-colors hover:text-brand"
      >
        {presupuestoContent.page.backHome}
      </Link>
    </div>
  );
}
