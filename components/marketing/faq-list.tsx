import Link from "next/link";
import { inlineLink } from "./styles";

export type FaqListItem = {
  readonly question: string;
  readonly answer: string;
  /** Convierte un tramo de la respuesta en link interno. */
  readonly link?: { readonly text: string; readonly href: string };
};

/**
 * Preguntas frecuentes en `<details>` nativo: accesible por teclado, sin
 * JavaScript y con todas las respuestas en el HTML del server (las lee el
 * crawler aunque estén cerradas). La primera va abierta, como en el lienzo.
 * Las mismas preguntas alimentan el `FAQPage` de la página.
 */
export function FaqList({ items }: { readonly items: readonly FaqListItem[] }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <details
          key={item.question}
          open={index === 0}
          className="group rounded-xl border border-card-line bg-card"
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-lg font-semibold text-fg [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="shrink-0 text-xl leading-none text-fg-muted transition-transform group-open:rotate-45 motion-reduce:transition-none"
            >
              +
            </span>
          </summary>
          <p className="px-5 pb-4 text-base text-fg-muted">
            <FaqAnswer item={item} />
          </p>
        </details>
      ))}
    </div>
  );
}

function FaqAnswer({ item }: { readonly item: FaqListItem }) {
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
