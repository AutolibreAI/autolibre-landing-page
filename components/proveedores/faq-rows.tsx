import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export type FaqRowItem = {
  readonly question: string;
  readonly answer: string;
  /** Convierte un tramo de la respuesta en link interno. */
  readonly link?: { readonly text: string; readonly href: string };
};

/**
 * Preguntas frecuentes en filas con filete (lienzos `Sumate` y `Planes`):
 * `<details>` nativo, accesible por teclado y sin JS, con todas las
 * respuestas en el HTML del server (las lee el crawler aunque estén
 * cerradas). Las mismas preguntas alimentan el `FAQPage` de la página.
 *
 * La pregunta va en el `<summary>` y no en un heading: así lo hace el resto
 * del sitio (`FaqList`) y el outline de la página no se llena de `h3`.
 */
export function FaqRows({ items }: { readonly items: readonly FaqRowItem[] }) {
  return (
    <div className="border-t border-fg">
      {items.map((item) => (
        <details key={item.question} className="group border-b border-card-line">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-lg font-semibold text-fg [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="shrink-0 transition-transform group-open:rotate-45 motion-reduce:transition-none"
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
  );
}

function FaqAnswer({ item }: { readonly item: FaqRowItem }) {
  const { answer, link } = item;
  const at = link ? answer.indexOf(link.text) : -1;
  if (!link || at === -1) return answer;
  return (
    <>
      {answer.slice(0, at)}
      <Link
        href={link.href}
        className="font-semibold text-fg underline underline-offset-4 transition-colors hover:text-brand-hover motion-reduce:transition-none"
      >
        {link.text}
      </Link>
      {answer.slice(at + link.text.length)}
    </>
  );
}
