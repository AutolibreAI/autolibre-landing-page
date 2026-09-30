import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Fuente de verdad documental (vive fuera del repo). Cada entrada es:
 *
 *   ### DOC-01 · Título
 *   - **Estado:** ✅ Confirmado (salvo matafuego/balizas en CABA: 🔍)
 *   - **Verificado:** 27/09/2026
 *
 * Estado:
 * - `confirmed`: arranca con ✅ y no menciona ⚠️/🔍.
 * - `mixed`: arranca con ✅ pero tiene una parte ⚠️/🔍 (se puede citar, con
 *   warning: el fact-checker tiene que confirmar que el claim cae en la
 *   parte confirmada).
 * - `contradiction` (⚠️), `pending` (🔍) o `unknown`: no se pueden citar.
 */

export type SourceStatus = "confirmed" | "mixed" | "contradiction" | "pending" | "unknown";

export interface SourceEntry {
  readonly id: string;
  readonly title: string;
  readonly status: SourceStatus;
  readonly rawStatus: string;
  /** Fechas ISO `YYYY-MM-DD` de la línea "Verificado", en orden de aparición. */
  readonly verified: readonly string[];
  /** Línea (1-based) del `###` en la fuente. */
  readonly line: number;
}

const ENTRY_RE = /^###\s+([A-Z]{2,5}-\d{1,3})\s*·\s*(.*)$/;
const STATUS_RE = /^\s*-\s*\*\*Estado:\*\*\s*(.*)$/;
const VERIFIED_RE = /^\s*-\s*\*\*Verificado:\*\*\s*(.*)$/;
const DATE_RE = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g;

const OK = "✅"; // ✅
const WARN = "⚠"; // ⚠ (con o sin el selector de variante)
const CHECK = "\u{1F50D}"; // 🔍

export function classifyStatus(raw: string): SourceStatus {
  const text = raw.trim();
  if (text.startsWith(OK)) {
    return text.includes(WARN) || text.includes(CHECK) ? "mixed" : "confirmed";
  }
  if (text.startsWith(WARN)) return "contradiction";
  if (text.startsWith(CHECK)) return "pending";
  return "unknown";
}

function parseDates(raw: string): string[] {
  const dates: string[] = [];
  for (const match of raw.matchAll(DATE_RE)) {
    const [, d, m, y] = match;
    dates.push(`${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`);
  }
  return dates;
}

export function parseSources(markdown: string): Map<string, SourceEntry> {
  const entries = new Map<string, SourceEntry>();
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");

  let current: { id: string; title: string; line: number; rawStatus: string; verified: string[] } | null = null;

  const flush = (): void => {
    if (!current) return;
    entries.set(current.id, {
      id: current.id,
      title: current.title,
      status: classifyStatus(current.rawStatus),
      rawStatus: current.rawStatus,
      verified: current.verified,
      line: current.line,
    });
    current = null;
  };

  lines.forEach((line, index) => {
    const entry = ENTRY_RE.exec(line);
    if (entry) {
      flush();
      current = { id: entry[1]!, title: entry[2]!.trim(), line: index + 1, rawStatus: "", verified: [] };
      return;
    }
    // Cualquier otro heading cierra la entrada en curso.
    if (/^#{1,3}\s/.test(line)) {
      flush();
      return;
    }
    if (!current) return;
    const status = STATUS_RE.exec(line);
    if (status && current.rawStatus === "") {
      current.rawStatus = status[1]!.trim();
      return;
    }
    const verified = VERIFIED_RE.exec(line);
    if (verified) current.verified.push(...parseDates(verified[1]!));
  });
  flush();

  return entries;
}

/** Raíz del repo, derivada de la ubicación de este archivo (`scripts/blog/lib/`). */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export function defaultSourcesPath(): string {
  const fromEnv = process.env.BLOG_SOURCE_OF_TRUTH?.trim();
  if (fromEnv) return path.resolve(REPO_ROOT, fromEnv);
  return path.resolve(REPO_ROOT, "../autolibre-fuente-verdad-documental-amba.md");
}

export function loadSources(file: string = defaultSourcesPath()): Map<string, SourceEntry> {
  return parseSources(readFileSync(file, "utf8"));
}

/** Días entre dos fechas ISO `YYYY-MM-DD` (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
