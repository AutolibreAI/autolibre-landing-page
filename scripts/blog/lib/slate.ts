import type { Block, Inline, TextLeaf } from "./markdown.ts";

/**
 * Markdown restringido → Slate de Hygraph (el `content` de `createPost`, sin
 * wrapper `raw`). Las formas salen de un dry_run contra Hygraph master
 * (30/09/2026). Ojo: ese dry_run NO valida la estructura — aceptó
 * `heading-seven` y un `paragraph` suelto dentro de una lista —, así que
 * `assertSlate` es la única red antes de escribir.
 */

export interface SlateText {
  readonly text: string;
  readonly bold?: true;
  readonly italic?: true;
}

export interface SlateElement {
  readonly type: string;
  readonly children: readonly SlateNode[];
  readonly [key: string]: unknown;
}

export type SlateNode = SlateText | SlateElement;

export interface SlateContent {
  readonly children: readonly SlateElement[];
}

export interface SlateOptions {
  /** Archivo de imagen del draft (`images/x.webp`) → id del Asset en Hygraph. */
  readonly assetIds?: ReadonlyMap<string, string>;
}

const HEADING_TYPES = { 2: "heading-two", 3: "heading-three", 4: "heading-four" } as const;

export function normalizeImageRef(ref: string): string {
  return ref.trim().replace(/^\.\//, "");
}

function leaf(node: TextLeaf): SlateText {
  const out: { text: string; bold?: true; italic?: true } = { text: node.text };
  if (node.bold) out.bold = true;
  if (node.italic) out.italic = true;
  return out;
}

function isExternal(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href);
}

function inlines(nodes: readonly Inline[]): SlateNode[] {
  const out: SlateNode[] = nodes.map((node) => {
    if (node.kind === "text") return leaf(node);
    const children = node.children.map(leaf);
    // Orden de claves estable (type, href, openInNewTab, children): el hash del payload depende de él.
    return isExternal(node.href)
      ? { type: "link", href: node.href, openInNewTab: true, children }
      : { type: "link", href: node.href, children };
  });
  return out.length > 0 ? out : [{ text: "" }];
}

function paragraph(nodes: readonly Inline[]): SlateElement {
  return { type: "paragraph", children: inlines(nodes) };
}

export class SlateConversionError extends Error {}

export function mdToSlate(blocks: readonly Block[], options: SlateOptions = {}): SlateContent {
  const children: SlateElement[] = [];

  for (const block of blocks) {
    switch (block.kind) {
      case "heading":
        children.push({ type: HEADING_TYPES[block.level], children: inlines(block.inlines) });
        break;
      case "paragraph":
        children.push(paragraph(block.inlines));
        break;
      case "quote":
        children.push({ type: "block-quote", children: inlines(block.inlines) });
        break;
      case "list":
        children.push({
          type: block.ordered ? "numbered-list" : "bulleted-list",
          children: block.items.map((item) => ({
            type: "list-item",
            children: [{ type: "list-item-child", children: [paragraph(item)] }],
          })),
        });
        break;
      case "table":
        children.push({
          type: "table",
          children: [
            {
              type: "table_head",
              children: [
                {
                  type: "table_row",
                  children: block.header.map((cell) => ({ type: "table_header_cell", children: [paragraph(cell)] })),
                },
              ],
            },
            {
              type: "table_body",
              children: block.rows.map((row) => ({
                type: "table_row",
                children: row.map((cell) => ({ type: "table_cell", children: [paragraph(cell)] })),
              })),
            },
          ],
        });
        break;
      case "image": {
        const nodeId = options.assetIds?.get(normalizeImageRef(block.src));
        if (!nodeId) {
          throw new SlateConversionError(
            `línea ${block.line}: la imagen "${block.src}" no tiene assetId (subila a Hygraph y completá images[].assetId en el frontmatter)`,
          );
        }
        children.push({ type: "embed", nodeId, nodeType: "Asset", children: [{ text: "" }] });
        break;
      }
    }
  }

  return { children };
}

// ---------------------------------------------------------------------------
// assertSlate: gramática padre → hijo que Hygraph renderiza bien.
// ---------------------------------------------------------------------------

type ChildRule = "inline" | readonly string[];

const BLOCK_TYPES = [
  "heading-two",
  "heading-three",
  "heading-four",
  "paragraph",
  "bulleted-list",
  "numbered-list",
  "block-quote",
  "table",
  "embed",
] as const;

const GRAMMAR: Readonly<Record<string, ChildRule>> = {
  "heading-two": "inline",
  "heading-three": "inline",
  "heading-four": "inline",
  paragraph: "inline",
  "block-quote": "inline",
  "bulleted-list": ["list-item"],
  "numbered-list": ["list-item"],
  "list-item": ["list-item-child"],
  "list-item-child": ["paragraph"],
  table: ["table_head", "table_body"],
  table_head: ["table_row"],
  table_body: ["table_row"],
  table_header_cell: ["paragraph"],
  table_cell: ["paragraph"],
  embed: "inline",
};

const TEXT_KEYS = new Set(["text", "bold", "italic"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkText(node: Record<string, unknown>, where: string, errors: string[]): void {
  if (typeof node.text !== "string") errors.push(`${where}: nodo de texto sin \`text\` string`);
  for (const key of Object.keys(node)) {
    if (!TEXT_KEYS.has(key)) errors.push(`${where}: marca "${key}" no soportada en un nodo de texto`);
    else if (key !== "text" && node[key] !== true) errors.push(`${where}: la marca "${key}" tiene que ser true`);
  }
}

function checkInlineChildren(children: readonly unknown[], where: string, errors: string[]): void {
  children.forEach((child, index) => {
    const at = `${where}.children[${index}]`;
    if (!isObject(child)) {
      errors.push(`${at}: nodo inválido`);
      return;
    }
    if (child.type === "link") {
      if (typeof child.href !== "string" || child.href === "") errors.push(`${at}: link sin href`);
      if (child.openInNewTab !== undefined && typeof child.openInNewTab !== "boolean") {
        errors.push(`${at}: openInNewTab tiene que ser boolean`);
      }
      const linkChildren = Array.isArray(child.children) ? child.children : [];
      if (linkChildren.length === 0) errors.push(`${at}: link sin children`);
      linkChildren.forEach((grand, gi) => {
        const gat = `${at}.children[${gi}]`;
        if (!isObject(grand) || "type" in grand) errors.push(`${gat}: un link solo puede tener nodos de texto`);
        else checkText(grand, gat, errors);
      });
      return;
    }
    if ("type" in child) {
      errors.push(`${at}: "${String(child.type)}" no puede ir dentro de un bloque de texto`);
      return;
    }
    checkText(child, at, errors);
  });
}

function checkElement(node: unknown, where: string, errors: string[], expected: readonly string[]): void {
  if (!isObject(node)) {
    errors.push(`${where}: nodo inválido`);
    return;
  }
  const type = node.type;
  if (typeof type !== "string" || !expected.includes(type)) {
    errors.push(`${where}: se esperaba ${expected.join("|")} y vino ${typeof type === "string" ? `"${type}"` : "un nodo sin type"}`);
    return;
  }
  const children = Array.isArray(node.children) ? node.children : null;
  if (!children || children.length === 0) {
    errors.push(`${where} (${type}): children vacío`);
    return;
  }

  if (type === "embed") {
    if (typeof node.nodeId !== "string" || node.nodeId === "") errors.push(`${where}: embed sin nodeId`);
    if (node.nodeType !== "Asset") errors.push(`${where}: embed con nodeType distinto de "Asset"`);
    if (children.length !== 1 || !isObject(children[0]) || children[0].text !== "") {
      errors.push(`${where}: embed tiene que tener children [{ text: "" }]`);
    }
    return;
  }

  const rule = GRAMMAR[type];
  if (rule === "inline") {
    checkInlineChildren(children, where, errors);
    return;
  }
  if (!rule) return;

  if (type === "table") {
    const types = children.map((c) => (isObject(c) ? c.type : undefined));
    if (types.length !== 2 || types[0] !== "table_head" || types[1] !== "table_body") {
      errors.push(`${where}: una tabla tiene que ser [table_head, table_body]`);
      return;
    }
    const head = children[0] as Record<string, unknown>;
    const body = children[1] as Record<string, unknown>;
    checkRows(head, `${where}.children[0]`, "table_header_cell", errors);
    checkRows(body, `${where}.children[1]`, "table_cell", errors);
    return;
  }

  children.forEach((child, index) => checkElement(child, `${where}.children[${index}]`, errors, rule));
}

function checkRows(section: Record<string, unknown>, where: string, cellType: string, errors: string[]): void {
  const rows = Array.isArray(section.children) ? section.children : [];
  if (rows.length === 0) {
    errors.push(`${where} (${String(section.type)}): sin filas`);
    return;
  }
  let width: number | null = null;
  rows.forEach((row, ri) => {
    const at = `${where}.children[${ri}]`;
    if (!isObject(row) || row.type !== "table_row") {
      errors.push(`${at}: se esperaba table_row`);
      return;
    }
    const cells = Array.isArray(row.children) ? row.children : [];
    if (cells.length === 0) errors.push(`${at}: fila sin celdas`);
    if (width === null) width = cells.length;
    else if (cells.length !== width) errors.push(`${at}: fila con ${cells.length} celdas (se esperaban ${width})`);
    cells.forEach((cell, ci) => checkElement(cell, `${at}.children[${ci}]`, errors, [cellType]));
  });
}

/** Lista de violaciones de la gramática (vacía = AST válido). */
export function checkSlate(content: unknown): string[] {
  const errors: string[] = [];
  const children = isObject(content) && Array.isArray(content.children) ? content.children : null;
  if (!children) return ["content tiene que ser { children: [...] }"];
  if (children.length === 0) return ["content sin bloques"];
  children.forEach((node, index) => checkElement(node, `children[${index}]`, errors, BLOCK_TYPES));
  return errors;
}

export class SlateGrammarError extends Error {
  readonly issues: readonly string[];
  constructor(issues: readonly string[]) {
    super(`Slate inválido:\n- ${issues.join("\n- ")}`);
    this.issues = issues;
  }
}

export function assertSlate(content: unknown): asserts content is SlateContent {
  const issues = checkSlate(content);
  if (issues.length > 0) throw new SlateGrammarError(issues);
}
