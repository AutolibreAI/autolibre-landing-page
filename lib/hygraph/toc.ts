import { isText, type RichTextContent } from "@graphcms/rich-text-types";

export interface TocItem {
  readonly id: string;
  readonly text: string;
}

/**
 * El AST de Hygraph es un árbol Slate: cada nodo es texto (`{ text }`) o un
 * elemento con `children`. Estos dos walkers lo recorren sin tipar cada forma
 * posible de nodo — alcanza con "¿tiene `.text`?" / "¿tiene `.children`?".
 */
type SlateNode = { readonly type?: string; readonly children?: readonly unknown[] };

function topLevel(content: RichTextContent): readonly unknown[] {
  return Array.isArray(content) ? content : (content?.children ?? []);
}

function textOf(node: unknown): string {
  if (isText(node as never)) return (node as { text: string }).text;
  const children = (node as SlateNode)?.children ?? [];
  return children.map(textOf).join("");
}

/**
 * Subtítulos (`##`, `heading-two`) del cuerpo, en orden de aparición. El
 * `id` es posicional (`section-0`, `section-1`, ...) porque el AST de
 * Hygraph no trae anchors propios; `RichText` (components/blog/rich-text.tsx)
 * le asigna el mismo id al heading correspondiente al renderizarlo, contando
 * en el mismo orden — ese conteo compartido es lo único que los une.
 */
export function extractToc(content: RichTextContent): TocItem[] {
  const items: TocItem[] = [];
  let index = 0;

  function walk(node: unknown): void {
    const type = (node as SlateNode)?.type;
    if (type === "heading-two") {
      items.push({ id: `section-${index}`, text: textOf(node).trim() });
      index++;
      return; // no hay headings dentro de un heading
    }
    for (const child of (node as SlateNode)?.children ?? []) walk(child);
  }

  for (const node of topLevel(content)) walk(node);

  return items.filter((item) => item.text !== "");
}

/** ~200 palabras por minuto, redondeado para arriba, mínimo 1. */
export function estimateReadingMinutes(content: RichTextContent): number {
  const words = topLevel(content)
    .map(textOf)
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 200));
}
