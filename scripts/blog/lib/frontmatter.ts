import { parse } from "yaml";

/**
 * Separa el frontmatter YAML (`---` ... `---`) del cuerpo Markdown.
 * `bodyLine` es el número de línea (1-based) del archivo donde arranca el
 * cuerpo, para que los errores del parser apunten a la línea real del draft.
 */
export interface FrontmatterResult {
  readonly data: Record<string, unknown>;
  readonly body: string;
  readonly bodyLine: number;
  readonly error: string | null;
}

export function splitFrontmatter(source: string): FrontmatterResult {
  const text = source.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const lines = text.split("\n");

  if (lines[0]?.trim() !== "---") {
    return { data: {}, body: text, bodyLine: 1, error: "falta el frontmatter (el archivo tiene que arrancar con `---`)" };
  }

  const end = lines.findIndex((line, i) => i > 0 && line.trim() === "---");
  if (end === -1) {
    return { data: {}, body: "", bodyLine: lines.length + 1, error: "el frontmatter no cierra con `---`" };
  }

  const yamlText = lines.slice(1, end).join("\n");
  const body = lines.slice(end + 1).join("\n");
  const bodyLine = end + 2;

  try {
    const data: unknown = parse(yamlText);
    if (data === null || data === undefined) {
      return { data: {}, body, bodyLine, error: "el frontmatter está vacío" };
    }
    if (typeof data !== "object" || Array.isArray(data)) {
      return { data: {}, body, bodyLine, error: "el frontmatter tiene que ser un objeto YAML" };
    }
    return { data: data as Record<string, unknown>, body, bodyLine, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: {}, body, bodyLine, error: `YAML inválido en el frontmatter: ${message}` };
  }
}
