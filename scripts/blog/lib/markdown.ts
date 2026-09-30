/**
 * Parser del Markdown restringido de los drafts del blog. El subset ES el
 * contrato: lo que no se puede renderizar bien en Hygraph se rechaza con el
 * número de línea, en lugar de convertirse "más o menos".
 *
 * Permitido:
 * - `##` / `###` / `####`
 * - párrafos (líneas contiguas), `**bold**`, `*italic*`, `[texto](url)`
 * - listas `- ` o `1. ` de un nivel
 * - `> ` (block-quote de texto)
 * - `![alt](archivo)` sola en su línea
 * - tablas GFM simples (header + separador + filas; los `:` se ignoran)
 * - marcadores `[src:ID]` / `[src:ID,ID]` (se quitan del texto)
 *
 * Rechazado: `#`, `#####`+, HTML, listas anidadas/indentación, código,
 * separadores (`---`), links por referencia, imágenes inline y tablas sin
 * separador o con filas de distinta cantidad de celdas.
 */

export interface TextLeaf {
  readonly kind: "text";
  readonly text: string;
  readonly bold?: true;
  readonly italic?: true;
}

export interface LinkInline {
  readonly kind: "link";
  readonly href: string;
  readonly children: readonly TextLeaf[];
}

export type Inline = TextLeaf | LinkInline;

export type HeadingLevel = 2 | 3 | 4;

export type Block =
  | { readonly kind: "heading"; readonly level: HeadingLevel; readonly inlines: readonly Inline[]; readonly line: number }
  | { readonly kind: "paragraph"; readonly inlines: readonly Inline[]; readonly line: number }
  | { readonly kind: "quote"; readonly inlines: readonly Inline[]; readonly line: number }
  | {
      readonly kind: "list";
      readonly ordered: boolean;
      readonly items: readonly (readonly Inline[])[];
      readonly line: number;
    }
  | {
      readonly kind: "table";
      readonly header: readonly (readonly Inline[])[];
      readonly rows: readonly (readonly (readonly Inline[])[])[];
      readonly line: number;
    }
  | { readonly kind: "image"; readonly alt: string; readonly src: string; readonly line: number };

export interface SourceRef {
  readonly id: string;
  readonly line: number;
}

export interface LinkRef {
  readonly href: string;
  readonly line: number;
}

export interface ParseIssue {
  readonly line: number;
  readonly message: string;
}

export interface ParsedMarkdown {
  readonly blocks: readonly Block[];
  readonly sourceRefs: readonly SourceRef[];
  readonly links: readonly LinkRef[];
  readonly errors: readonly ParseIssue[];
}

const HEADING_RE = /^(#+)(\s+|$)(.*)$/;
const BULLET_RE = /^-\s+(.*)$/;
const ORDERED_RE = /^\d+\.\s+(.*)$/;
const OTHER_BULLET_RE = /^[*+]\s+/;
const IMAGE_LINE_RE = /^!\[([^\]]*)\]\(([^)\s]*)\)$/;
const FENCE_RE = /^(```|~~~)/;
const HR_RE = /^(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/;
const SETEXT_RE = /^=+\s*$/;
const REF_DEF_RE = /^\[[^\]]+\]:\s*\S+/;
const TABLE_SEP_CELL_RE = /^:?-+:?$/;
const SRC_ID_RE = /^[A-Z]{2,5}-\d{1,3}$/;
const HTML_RE = /<\/?[A-Za-z][^>]*>|<!--/;

class InlineError extends Error {}

/** Contexto que acumula lo que se encuentra al parsear inlines de una línea. */
interface InlineContext {
  readonly line: number;
  readonly sourceRefs: SourceRef[];
  readonly links: LinkRef[];
}

type Marks = { readonly bold?: true; readonly italic?: true };

function pushText(out: Inline[], text: string, marks: Marks): void {
  if (text === "") return;
  const last = out[out.length - 1];
  if (last && last.kind === "text" && last.bold === marks.bold && last.italic === marks.italic) {
    out[out.length - 1] = { ...last, text: last.text + text };
    return;
  }
  out.push({ kind: "text", text, ...marks });
}

/** Índice del `*` que cierra un itálico abierto en `start - 1`, salteando los `**`. */
function findClosingSingle(s: string, start: number): number {
  let j = start;
  while (j < s.length) {
    if (s[j] === "\\") {
      j += 2;
      continue;
    }
    if (s[j] === "*") {
      if (s[j + 1] === "*") {
        const close = s.indexOf("**", j + 2);
        if (close === -1) return -1;
        j = close + 2;
        continue;
      }
      return j;
    }
    j++;
  }
  return -1;
}

/** Índice del `**` que cierra un bold abierto antes de `start` (el último de una corrida de `*`). */
function findClosingDouble(s: string, start: number): number {
  let idx = s.indexOf("**", start);
  if (idx === -1) return -1;
  while (s[idx + 2] === "*") idx++;
  return idx;
}

function parseInlinesInto(s: string, marks: Marks, ctx: InlineContext, out: Inline[], inLink: boolean): void {
  let i = 0;
  let buf = "";
  const flush = (): void => {
    pushText(out, buf, marks);
    buf = "";
  };

  while (i < s.length) {
    const ch = s[i]!;

    if (ch === "\\" && i + 1 < s.length && /[\\`*_{}\[\]()#+\-.!|>]/.test(s[i + 1]!)) {
      buf += s[i + 1];
      i += 2;
      continue;
    }

    if (ch === "`") throw new InlineError("código inline (`) no permitido");

    if (ch === "<" && HTML_RE.test(s.slice(i))) {
      const rest = s.slice(i);
      const match = HTML_RE.exec(rest);
      if (match && match.index === 0) throw new InlineError("HTML no permitido");
    }
    if (ch === "<" && /^<(?:https?:|mailto:)/.test(s.slice(i))) {
      throw new InlineError("autolinks `<url>` no permitidos: usá [texto](url)");
    }

    if (s.startsWith("[src:", i)) {
      const close = s.indexOf("]", i);
      if (close === -1) throw new InlineError("marcador [src:…] sin cerrar");
      const ids = s
        .slice(i + 5, close)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (ids.length === 0) throw new InlineError("marcador [src:] vacío");
      for (const id of ids) {
        if (!SRC_ID_RE.test(id)) throw new InlineError(`ID de fuente mal formado en [src:…]: "${id}"`);
        ctx.sourceRefs.push({ id, line: ctx.line });
      }
      // "texto [src:DOC-01]." → "texto.": el espacio previo al marcador se va con él.
      buf = buf.replace(/[ \t]+$/, "");
      if (buf === "") {
        const last = out[out.length - 1];
        if (last && last.kind === "text") {
          out[out.length - 1] = { ...last, text: last.text.replace(/[ \t]+$/, "") };
        }
      }
      i = close + 1;
      continue;
    }

    if (ch === "!" && s[i + 1] === "[") {
      throw new InlineError("las imágenes van solas en su propia línea: ![alt](archivo)");
    }

    if (ch === "[") {
      const closeText = s.indexOf("]", i + 1);
      if (closeText !== -1 && s[closeText + 1] === "(") {
        const closeHref = s.indexOf(")", closeText + 2);
        if (closeHref === -1) throw new InlineError("link sin cerrar: falta `)`");
        if (inLink) throw new InlineError("links anidados no permitidos");
        const href = s.slice(closeText + 2, closeHref).trim();
        if (href === "" || /\s/.test(href)) throw new InlineError("link con URL vacía o con espacios");
        flush();
        const children: Inline[] = [];
        parseInlinesInto(s.slice(i + 1, closeText), marks, ctx, children, true);
        if (children.length === 0) throw new InlineError("link sin texto");
        out.push({ kind: "link", href, children: children as TextLeaf[] });
        ctx.links.push({ href, line: ctx.line });
        i = closeHref + 1;
        continue;
      }
      if (closeText !== -1 && s[closeText + 1] === "[") {
        throw new InlineError("links por referencia ([texto][ref]) no permitidos: usá [texto](url)");
      }
      buf += ch;
      i++;
      continue;
    }

    if (ch === "*" && s[i + 1] === "*") {
      const close = findClosingDouble(s, i + 2);
      if (close === -1 || close === i + 2) throw new InlineError("`**` sin cerrar");
      flush();
      parseInlinesInto(s.slice(i + 2, close), { ...marks, bold: true }, ctx, out, inLink);
      i = close + 2;
      continue;
    }

    if (ch === "*") {
      const close = findClosingSingle(s, i + 1);
      if (close === -1 || close === i + 1) throw new InlineError("`*` sin cerrar");
      flush();
      parseInlinesInto(s.slice(i + 1, close), { ...marks, italic: true }, ctx, out, inLink);
      i = close + 1;
      continue;
    }

    buf += ch;
    i++;
  }
  flush();
}

function parseInlines(text: string, ctx: InlineContext, errors: ParseIssue[]): Inline[] {
  const out: Inline[] = [];
  try {
    parseInlinesInto(text, {}, ctx, out, false);
  } catch (err) {
    if (err instanceof InlineError) {
      errors.push({ line: ctx.line, message: err.message });
      return [];
    }
    throw err;
  }
  // Recorte de bordes: el texto de un bloque no arranca ni termina en espacio.
  const first = out[0];
  if (first && first.kind === "text") out[0] = { ...first, text: first.text.replace(/^\s+/, "") };
  const lastIndex = out.length - 1;
  const last = out[lastIndex];
  if (last && last.kind === "text") out[lastIndex] = { ...last, text: last.text.replace(/\s+$/, "") };
  return out.filter((node) => node.kind !== "text" || node.text !== "");
}

/** Celdas de una fila de tabla: separa por `|` no escapado y quita los bordes. */
function splitRow(line: string): string[] {
  let text = line.trim();
  if (text.startsWith("|")) text = text.slice(1);
  if (text.endsWith("|") && !text.endsWith("\\|")) text = text.slice(0, -1);
  const cells: string[] = [];
  let current = "";
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\\" && text[i + 1] === "|") {
      current += "|";
      i++;
      continue;
    }
    if (text[i] === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += text[i];
  }
  cells.push(current.trim());
  return cells;
}

function isTableLine(line: string): boolean {
  return line.trimStart().startsWith("|");
}

export function parseMarkdown(body: string, firstLine = 1): ParsedMarkdown {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  const errors: ParseIssue[] = [];
  const sourceRefs: SourceRef[] = [];
  const links: LinkRef[] = [];

  const lineNo = (index: number): number => firstLine + index;
  const ctx = (index: number): InlineContext => ({ line: lineNo(index), sourceRefs, links });
  const fail = (index: number, message: string): void => {
    errors.push({ line: lineNo(index), message });
  };

  /** ¿Esta línea arranca un bloque distinto de un párrafo? */
  const startsBlock = (line: string): boolean =>
    HEADING_RE.test(line) ||
    BULLET_RE.test(line) ||
    ORDERED_RE.test(line) ||
    OTHER_BULLET_RE.test(line) ||
    line.startsWith(">") ||
    IMAGE_LINE_RE.test(line.trim()) ||
    FENCE_RE.test(line) ||
    HR_RE.test(line.trim()) ||
    isTableLine(line);

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i]!;
    const line = raw.replace(/\s+$/, "");

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (/^( {2,}|\t)/.test(line)) {
      const trimmed = line.trim();
      if (BULLET_RE.test(trimmed) || ORDERED_RE.test(trimmed) || OTHER_BULLET_RE.test(trimmed)) {
        fail(i, "listas anidadas no permitidas (solo un nivel)");
      } else {
        fail(i, "línea indentada no permitida (código o contenido anidado)");
      }
      i++;
      continue;
    }

    if (FENCE_RE.test(line)) {
      fail(i, "bloques de código no permitidos");
      i++;
      while (i < lines.length && !FENCE_RE.test(lines[i]!)) i++;
      i++;
      continue;
    }

    if (HR_RE.test(line.trim())) {
      fail(i, "separadores (---, ***, ___) no permitidos");
      i++;
      continue;
    }

    if (SETEXT_RE.test(line)) {
      fail(i, "headings con subrayado (===) no permitidos: usá ##");
      i++;
      continue;
    }

    if (REF_DEF_RE.test(line) && !line.startsWith("[src:")) {
      fail(i, "definiciones de links por referencia no permitidas: usá [texto](url)");
      i++;
      continue;
    }

    if (HTML_RE.test(line) && /^\s*<(?:[A-Za-z/!])/.test(line)) {
      fail(i, "HTML no permitido");
      i++;
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      const level = heading[1]!.length;
      const text = heading[3]!.replace(/\s+#+\s*$/, "").trim();
      if (level === 1) fail(i, "heading h1 no permitido: el título del post sale del frontmatter");
      else if (level > 4) fail(i, `heading h${level} no permitido (solo ##, ### y ####)`);
      else if (text === "") fail(i, "heading vacío");
      else {
        const inlines = parseInlines(text, ctx(i), errors);
        if (inlines.some((node) => node.kind === "link")) fail(i, "links dentro de headings no permitidos");
        else blocks.push({ kind: "heading", level: level as HeadingLevel, inlines, line: lineNo(i) });
      }
      i++;
      continue;
    }

    if (OTHER_BULLET_RE.test(line)) {
      fail(i, "viñetas con `*` o `+` no permitidas: usá `- `");
      i++;
      continue;
    }

    const image = IMAGE_LINE_RE.exec(line.trim());
    if (image) {
      blocks.push({ kind: "image", alt: image[1]!.trim(), src: image[2]!.trim(), line: lineNo(i) });
      i++;
      continue;
    }

    if (line.startsWith(">")) {
      const start = i;
      const parts: string[] = [];
      while (i < lines.length && lines[i]!.startsWith(">")) {
        const content = lines[i]!.replace(/^>\s?/, "");
        if (content.startsWith(">")) fail(i, "citas anidadas no permitidas");
        else if (startsBlock(content.trim()) && content.trim() !== "") fail(i, "solo texto dentro de una cita (>)");
        else parts.push(content.trim());
        i++;
      }
      const text = parts.filter(Boolean).join(" ");
      if (text !== "") blocks.push({ kind: "quote", inlines: parseInlines(text, ctx(start), errors), line: lineNo(start) });
      continue;
    }

    if (isTableLine(line)) {
      const start = i;
      const header = splitRow(line);
      const sepLine = lines[i + 1];
      const sep = sepLine !== undefined && isTableLine(sepLine) ? splitRow(sepLine) : null;
      if (!sep || !sep.every((cell) => TABLE_SEP_CELL_RE.test(cell.replace(/\s+/g, "")))) {
        fail(i, "tabla sin fila separadora (| --- | --- |) debajo del encabezado");
        while (i < lines.length && isTableLine(lines[i]!)) i++;
        continue;
      }
      if (sep.length !== header.length) {
        fail(i + 1, `tabla irregular: el separador tiene ${sep.length} celdas y el encabezado ${header.length}`);
      }
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && isTableLine(lines[i]!)) {
        const cells = splitRow(lines[i]!);
        if (cells.length !== header.length) {
          fail(i, `tabla irregular: la fila tiene ${cells.length} celdas y el encabezado ${header.length}`);
        } else {
          rows.push(cells.map((cell) => parseInlines(cell, ctx(i), errors)));
        }
        i++;
      }
      blocks.push({
        kind: "table",
        header: header.map((cell) => parseInlines(cell, ctx(start), errors)),
        rows,
        line: lineNo(start),
      });
      continue;
    }

    const bullet = BULLET_RE.exec(line);
    const ordered = ORDERED_RE.exec(line);
    if (bullet || ordered) {
      const isOrdered = !bullet;
      const itemRe = isOrdered ? ORDERED_RE : BULLET_RE;
      const start = i;
      const items: Inline[][] = [];
      while (i < lines.length) {
        const current = lines[i]!.replace(/\s+$/, "");
        const match = itemRe.exec(current);
        if (match) {
          const itemLine = i;
          const parts = [match[1]!];
          i++;
          // Continuación "perezosa": líneas de texto pegadas al ítem.
          while (i < lines.length) {
            const next = lines[i]!.replace(/\s+$/, "");
            if (next.trim() === "" || startsBlock(next) || /^( {2,}|\t)/.test(next)) break;
            parts.push(next.trim());
            i++;
          }
          items.push(parseInlines(parts.join(" "), ctx(itemLine), errors));
          continue;
        }
        // Una línea en blanco entre ítems del mismo tipo no corta la lista.
        if (current.trim() === "") {
          let j = i;
          while (j < lines.length && lines[j]!.trim() === "") j++;
          if (j < lines.length && itemRe.test(lines[j]!)) {
            i = j;
            continue;
          }
        }
        break;
      }
      blocks.push({ kind: "list", ordered: isOrdered, items, line: lineNo(start) });
      continue;
    }

    // Párrafo: líneas contiguas hasta una en blanco o el arranque de otro bloque.
    const start = i;
    const parts: string[] = [line.trim()];
    i++;
    while (i < lines.length) {
      const next = lines[i]!.replace(/\s+$/, "");
      if (next.trim() === "" || startsBlock(next) || /^( {2,}|\t)/.test(next)) break;
      if (SETEXT_RE.test(next)) break;
      parts.push(next.trim());
      i++;
    }
    const inlines = parseInlines(parts.join(" "), ctx(start), errors);
    if (inlines.length > 0) blocks.push({ kind: "paragraph", inlines, line: lineNo(start) });
  }

  return { blocks, sourceRefs, links, errors };
}

/** Texto plano de una lista de inlines (para contar palabras, FAQ, etc.). */
export function inlineText(inlines: readonly Inline[]): string {
  return inlines.map((node) => (node.kind === "text" ? node.text : inlineText(node.children))).join("");
}
