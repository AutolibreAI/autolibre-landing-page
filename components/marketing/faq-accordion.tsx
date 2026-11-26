import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { inlineLink } from "./styles";

export type FaqAccordionItem = {
  readonly question: string;
  /** Texto plano completo: es lo que se ve y lo que va al `FAQPage`. */
  readonly answer: string;
  /** Convierte un tramo de la respuesta en link interno. */
  readonly link?: { readonly text: string; readonly href: string };
};

type FaqAccordionProps = {
  readonly items: readonly FaqAccordionItem[];
  /** La primera pregunta viene abierta (Home y `/pedido`). */
  readonly openFirst?: boolean;
  /**
   * Título del grupo. El nivel lo decide la página (`h2` o `h3` según el
   * outline), nunca el componente; el tamaño visual es siempre el mismo.
   */
  readonly heading?: {
    readonly as: "h2" | "h3";
    readonly id: string;
    readonly text: string;
  };
  readonly className?: string;
};

/**
 * Preguntas frecuentes del sitio (una sola forma, rediseño de la FAQ del
 * 2026-11-26): filas con filete, sin caja por pregunta y un solo ícono
 * (`plus`, que gira 45° al abrir; sin transición con `prefers-reduced-motion`).
 *
 * Server Component sin JS: `<details>/<summary>` nativo, accesible por
 * teclado (el foco visible lo da la regla global `:focus-visible`), con todas
 * las respuestas en el HTML del server aunque estén cerradas. La pregunta va
 * en el `<summary>` y no en un heading: el outline no se llena de `h3`. Cada
 * página pasa las MISMAS preguntas a su `FAQPage`.
 */
export function FaqAccordion({ items, openFirst = false, heading, className }: FaqAccordionProps) {
  const HeadingTag = heading?.as;
  return (
    <div className={className}>
      {heading && HeadingTag ? (
        <HeadingTag
          id={heading.id}
          className="mb-3 font-display text-xl font-bold tracking-tight text-fg"
        >
          {heading.text}
        </HeadingTag>
      ) : null}
      <div className="border-t border-fg">
        {items.map((item, index) => (
          <details
            key={item.question}
            open={openFirst && index === 0}
            className="group border-b border-card-line"
          >
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-lg font-semibold text-fg [&::-webkit-details-marker]:hidden">
              {item.question}
              <span
                aria-hidden="true"
                className="shrink-0 text-fg-muted transition-transform group-open:rotate-45 motion-reduce:transition-none"
              >
                <Icon name="plus" size={20} strokeWidth={2} />
              </span>
            </summary>
            <p className="max-w-170 pb-5 text-base text-fg-muted">
              <FaqAnswer item={item} />
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

function FaqAnswer({ item }: { readonly item: FaqAccordionItem }) {
  const { answer, link } = item;
  const at = link ? answer.indexOf(link.text) : -1;
  if (!link || at === -1) return answer;
  return (
    <>
      {answer.slice(0, at)}
      <Link href={link.href} className={inlineLink}>
        {link.text}
      </Link>
      {answer.slice(at + link.text.length)}
    </>
  );
}
