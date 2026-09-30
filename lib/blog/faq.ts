/**
 * Extrae las preguntas frecuentes de un rich text Slate (el AST de Hygraph o
 * el que arma `scripts/blog/lib/slate.ts`, que es el mismo).
 *
 * Convención: un `heading-two` cuyo texto normalizado coincide con `heading`
 * abre la sección; cada `heading-three` dentro de ella es una pregunta, y los
 * bloques hasta el próximo `heading-three`/`heading-two` son su respuesta.
 * Una pregunta sin respuesta se omite. Todo sale en texto plano.
 *
 * Lo comparten el front (JSON-LD `FAQPage`) y el pipeline del blog
 * (`build-payload` verifica que el draft emita el FAQ). Por eso este archivo
 * no importa nada: ni alias `@/` ni tipos de librerías, y solo usa sintaxis TS
 * borrable (corre con `node` sin build).
 */

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

type SlateLike = {
  readonly type?: unknown;
  readonly text?: unknown;
  readonly children?: readonly unknown[];
};

function topLevel(content: unknown): readonly unknown[] {
  if (Array.isArray(content)) return content;
  const children = (content as SlateLike | null | undefined)?.children;
  return Array.isArray(children) ? children : [];
}

function typeOf(node: unknown): string {
  const type = (node as SlateLike | null | undefined)?.type;
  return typeof type === "string" ? type : "";
}

function textOf(node: unknown): string {
  const value = node as SlateLike | null | undefined;
  if (typeof value?.text === "string") return value.text;
  const children = Array.isArray(value?.children) ? value.children : [];
  return children.map(textOf).join("");
}

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Texto plano de un bloque: las listas y tablas van un ítem/fila por línea. */
function blockText(node: unknown): string {
  const type = typeOf(node);
  const children = (node as SlateLike).children ?? [];
  if (type === "bulleted-list" || type === "numbered-list") {
    return children.map((item) => clean(textOf(item))).filter(Boolean).join("\n");
  }
  if (type === "table") {
    const rows: string[] = [];
    const walk = (n: unknown): void => {
      if (typeOf(n) === "table_row") {
        const cells = ((n as SlateLike).children ?? []).map((c) => clean(textOf(c)));
        rows.push(cells.join(" | "));
        return;
      }
      for (const child of (n as SlateLike).children ?? []) walk(child);
    };
    walk(node);
    return rows.filter((r) => r.replace(/[\s|]/g, "") !== "").join("\n");
  }
  return clean(textOf(node));
}

/** Minúsculas, sin tildes y con espacios colapsados: "Preguntas  Frecuentes " = "preguntas frecuentes". */
export function normalizeHeading(text: string): string {
  return clean(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function extractFaq(content: unknown, heading: string): FaqItem[] {
  const target = normalizeHeading(heading);
  const items: FaqItem[] = [];
  let inSection = false;
  let question: string | null = null;
  let answer: string[] = [];

  const flush = (): void => {
    if (question && answer.length > 0) {
      items.push({ question, answer: answer.join("\n") });
    }
    question = null;
    answer = [];
  };

  for (const node of topLevel(content)) {
    const type = typeOf(node);
    if (type === "heading-two") {
      flush();
      inSection = normalizeHeading(textOf(node)) === target;
      continue;
    }
    if (!inSection) continue;
    if (type === "heading-three") {
      flush();
      const text = clean(textOf(node));
      question = text === "" ? null : text;
      continue;
    }
    if (question === null) continue;
    const text = blockText(node);
    if (text !== "") answer.push(text);
  }
  flush();

  return items;
}
