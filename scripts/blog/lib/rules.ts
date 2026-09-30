import path from "node:path";
import { normalizeHeading } from "../../../lib/blog/faq.ts";
import { splitFrontmatter } from "./frontmatter.ts";
import { inlineText, parseMarkdown, type Block, type ParsedMarkdown } from "./markdown.ts";
import { findPost, type Plan } from "./plan.ts";
import { daysBetween, type SourceEntry } from "./sources.ts";

/**
 * Reglas de `validate.ts`. Los errores frenan el pipeline (exit 1); los
 * warnings se muestran pero no frenan (los revisa el humano o el
 * fact-checker).
 */

export const FAQ_HEADING = "Preguntas frecuentes";
export const META_TITLE_MAX = 48;
export const META_DESCRIPTION_RANGE = [70, 155] as const;
export const MIN_WORDS = 600;
export const MAX_SOURCE_AGE_DAYS = 90;

export interface Issue {
  readonly rule: string;
  readonly message: string;
  readonly line?: number;
}

export interface DraftImage {
  readonly file: string;
  readonly alt: string;
  readonly assetId: string | null;
}

export interface DraftFrontmatter {
  readonly title: string;
  readonly slug: string;
  readonly metaTitle: string;
  readonly metaDescription: string;
  readonly excerpt: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly date: string | null;
  readonly reviewedAt: string;
  readonly sourceIds: readonly string[];
  readonly cover: DraftImage;
  readonly images: readonly DraftImage[];
}

export interface ValidationInput {
  /** Path del draft: el nombre del archivo tiene que coincidir con el slug. */
  readonly file: string;
  readonly source: string;
  readonly plan: Plan;
  readonly sources: ReadonlyMap<string, SourceEntry>;
  /** Hoy en ISO `YYYY-MM-DD` (inyectable para tests). */
  readonly today: string;
}

export interface ValidationResult {
  readonly errors: readonly Issue[];
  readonly warnings: readonly Issue[];
  readonly frontmatter: DraftFrontmatter | null;
  readonly parsed: ParsedMarkdown;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function str(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  return "";
}

function strList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.map(str);
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
}

function toImage(value: unknown): DraftImage | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const assetId = str(v.assetId);
  return { file: str(v.file), alt: str(v.alt), assetId: assetId === "" ? null : assetId };
}

function chars(text: string): number {
  return [...text].length;
}

/** Lee y valida la forma del frontmatter. Devuelve `null` si falta algo imprescindible. */
function readFrontmatter(data: Record<string, unknown>, errors: Issue[]): DraftFrontmatter | null {
  const required = ["title", "slug", "metaTitle", "metaDescription", "excerpt", "category", "reviewedAt"] as const;
  const values: Record<string, string> = {};
  for (const key of required) {
    values[key] = str(data[key]);
    if (values[key] === "") errors.push({ rule: "frontmatter", message: `falta \`${key}\` (o está vacío)` });
  }

  const tags = strList(data.tags);
  if (!tags) errors.push({ rule: "frontmatter", message: "`tags` tiene que ser una lista" });

  const sourceIds = strList(data.sourceIds);
  if (!sourceIds || sourceIds.length === 0) {
    errors.push({ rule: "frontmatter", message: "`sourceIds` tiene que ser una lista no vacía" });
  }

  const reviewedAt = values.reviewedAt!;
  if (reviewedAt !== "" && !isValidIsoDate(reviewedAt)) {
    errors.push({ rule: "frontmatter", message: "`reviewedAt` tiene que ser una fecha YYYY-MM-DD" });
  }

  const date = str(data.date);
  if (date !== "" && !isValidIsoDate(date)) {
    errors.push({ rule: "frontmatter", message: "`date` tiene que ser una fecha YYYY-MM-DD" });
  }

  const cover = toImage(data.cover);
  if (!cover || cover.file === "") errors.push({ rule: "frontmatter", message: "falta `cover.file`" });
  if (cover && cover.alt === "") errors.push({ rule: "alt", message: "la cover no tiene `alt`" });
  if (!cover) errors.push({ rule: "alt", message: "falta `cover` con `file` y `alt`" });

  let images: DraftImage[] = [];
  if (data.images !== undefined && data.images !== null) {
    if (!Array.isArray(data.images)) {
      errors.push({ rule: "frontmatter", message: "`images` tiene que ser una lista de { file, alt }" });
    } else {
      images = data.images.map(toImage).filter((img): img is DraftImage => img !== null);
      images.forEach((img, index) => {
        if (img.file === "") errors.push({ rule: "frontmatter", message: `images[${index}] sin \`file\`` });
        if (img.alt === "") errors.push({ rule: "alt", message: `images[${index}] (${img.file}) sin \`alt\`` });
      });
    }
  }

  if (errors.some((e) => e.rule === "frontmatter") || !cover || !tags || !sourceIds) return null;

  return {
    title: values.title!,
    slug: values.slug!,
    metaTitle: values.metaTitle!,
    metaDescription: values.metaDescription!,
    excerpt: values.excerpt!,
    category: values.category!,
    tags,
    date: date === "" ? null : date,
    reviewedAt,
    sourceIds,
    cover,
    images,
  };
}

function blockText(block: Block): string {
  switch (block.kind) {
    case "heading":
    case "paragraph":
    case "quote":
      return inlineText(block.inlines);
    case "list":
      return block.items.map(inlineText).join(" ");
    case "table":
      return [...block.header, ...block.rows.flat()].map(inlineText).join(" ");
    case "image":
      return "";
  }
}

export function countWords(blocks: readonly Block[]): number {
  return blocks
    .map(blockText)
    .join(" ")
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

interface FaqQuestion {
  readonly text: string;
  readonly line: number;
  readonly answerBlocks: number;
}

/** Preguntas (`###`) de la sección FAQ del Markdown, o `null` si no hay sección. */
export function faqQuestions(blocks: readonly Block[], heading: string = FAQ_HEADING): FaqQuestion[] | null {
  const target = normalizeHeading(heading);
  let inSection = false;
  let found = false;
  const questions: { text: string; line: number; answerBlocks: number }[] = [];

  for (const block of blocks) {
    if (block.kind === "heading" && block.level === 2) {
      inSection = normalizeHeading(inlineText(block.inlines)) === target;
      if (inSection) found = true;
      continue;
    }
    if (!inSection) continue;
    if (block.kind === "heading" && block.level === 3) {
      questions.push({ text: inlineText(block.inlines).trim(), line: block.line, answerBlocks: 0 });
      continue;
    }
    const last = questions[questions.length - 1];
    if (last && blockText(block).trim() !== "") last.answerBlocks++;
  }

  return found ? questions : null;
}

export function validateDraft(input: ValidationInput): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  const fm = splitFrontmatter(input.source);
  if (fm.error) errors.push({ rule: "frontmatter", message: fm.error, line: 1 });

  const parsed = parseMarkdown(fm.body, fm.bodyLine);
  for (const issue of parsed.errors) errors.push({ rule: "subset", message: issue.message, line: issue.line });

  const frontmatter = fm.error ? null : readFrontmatter(fm.data, errors);

  // --- Slug y plan -------------------------------------------------------
  const fileSlug = path.basename(input.file).replace(/\.md$/i, "");
  if (frontmatter) {
    if (frontmatter.slug !== fileSlug) {
      errors.push({ rule: "slug", message: `el slug "${frontmatter.slug}" no coincide con el archivo "${fileSlug}.md"` });
    }
    const planPost = findPost(input.plan, frontmatter.slug);
    if (!planPost) errors.push({ rule: "plan", message: `el slug "${frontmatter.slug}" no está en plan.yaml` });
    else if (planPost.blockedBy) errors.push({ rule: "plan", message: `el post está bloqueado en plan.yaml: ${planPost.blockedBy}` });

    // --- Metadatos -------------------------------------------------------
    const titleLength = chars(frontmatter.metaTitle);
    if (titleLength > META_TITLE_MAX) {
      errors.push({ rule: "metaTitle", message: `metaTitle tiene ${titleLength} caracteres (máximo ${META_TITLE_MAX})` });
    }
    const descLength = chars(frontmatter.metaDescription);
    const [minDesc, maxDesc] = META_DESCRIPTION_RANGE;
    if (descLength < minDesc || descLength > maxDesc) {
      warnings.push({ rule: "metaDescription", message: `metaDescription tiene ${descLength} caracteres (ideal ${minDesc}–${maxDesc})` });
    }
  }

  // --- Headings: sin saltos de nivel (el h1 es el título) ----------------
  let previousLevel = 1;
  for (const block of parsed.blocks) {
    if (block.kind !== "heading") continue;
    if (block.level > previousLevel + 1) {
      errors.push({
        rule: "headings",
        line: block.line,
        message: `salto de heading: h${block.level} después de h${previousLevel}`,
      });
    }
    previousLevel = block.level;
  }

  // --- Fuentes -------------------------------------------------------------
  const cited = new Set<string>();
  const reported = new Set<string>();
  for (const ref of parsed.sourceRefs) {
    cited.add(ref.id);
    const entry = input.sources.get(ref.id);
    if (!entry) {
      errors.push({ rule: "src", line: ref.line, message: `[src:${ref.id}] no existe en la fuente de verdad` });
      continue;
    }
    if (entry.status !== "confirmed" && entry.status !== "mixed") {
      errors.push({
        rule: "src",
        line: ref.line,
        message: `[src:${ref.id}] no se puede citar: su estado no es ✅ (${entry.rawStatus || "sin estado"})`,
      });
      continue;
    }
    if (reported.has(ref.id)) continue;
    reported.add(ref.id);
    if (entry.status === "mixed") {
      warnings.push({
        rule: "src-mixed",
        line: ref.line,
        message: `[src:${ref.id}] tiene estado mixto (${entry.rawStatus}): el fact-checker tiene que confirmar que el claim cae en la parte ✅`,
      });
    }
    const oldest = [...entry.verified].sort()[0];
    if (!oldest) {
      warnings.push({ rule: "src-age", line: ref.line, message: `[src:${ref.id}] no tiene fecha de verificación` });
    } else if (daysBetween(oldest, input.today) > MAX_SOURCE_AGE_DAYS) {
      warnings.push({
        rule: "src-age",
        line: ref.line,
        message: `[src:${ref.id}] se verificó el ${oldest} (hace más de ${MAX_SOURCE_AGE_DAYS} días)`,
      });
    }
  }

  if (frontmatter) {
    const declared = new Set(frontmatter.sourceIds);
    for (const id of declared) {
      if (!cited.has(id)) errors.push({ rule: "sourceIds", message: `${id} está en sourceIds pero no se cita con [src:${id}]` });
    }
    for (const id of cited) {
      if (!declared.has(id)) errors.push({ rule: "sourceIds", message: `[src:${id}] se cita pero no está en sourceIds` });
    }
  }

  // --- Imágenes y tablas -------------------------------------------------
  const declaredImages = new Set((frontmatter?.images ?? []).map((img) => img.file.replace(/^\.\//, "")));
  for (const block of parsed.blocks) {
    if (block.kind === "image") {
      if (block.alt === "") errors.push({ rule: "alt", line: block.line, message: `la imagen "${block.src}" no tiene alt` });
      if (frontmatter && !declaredImages.has(block.src.replace(/^\.\//, ""))) {
        errors.push({ rule: "images", line: block.line, message: `la imagen "${block.src}" no está declarada en \`images\` del frontmatter` });
      }
    }
    if (block.kind === "table") {
      if (block.header.length < 2) errors.push({ rule: "table", line: block.line, message: "tabla con menos de 2 columnas" });
      if (block.rows.length === 0) errors.push({ rule: "table", line: block.line, message: "tabla sin filas" });
    }
  }

  // --- FAQ -------------------------------------------------------------------
  const questions = faqQuestions(parsed.blocks);
  if (questions) {
    if (questions.length < 2) {
      errors.push({ rule: "faq", message: `la sección "${FAQ_HEADING}" necesita al menos 2 preguntas (###)` });
    }
    for (const q of questions) {
      if (!q.text.endsWith("?")) errors.push({ rule: "faq", line: q.line, message: `la pregunta "${q.text}" no termina en "?"` });
      if (q.answerBlocks === 0) errors.push({ rule: "faq", line: q.line, message: `la pregunta "${q.text}" no tiene respuesta` });
    }
  }

  // --- Links -----------------------------------------------------------------
  for (const link of parsed.links) {
    const href = link.href;
    if (href.startsWith("/blog/")) {
      const slug = href.replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop() ?? "";
      const target = findPost(input.plan, slug);
      if (!target || target.status !== "published") {
        errors.push({ rule: "links", line: link.line, message: `link a "${href}": ese post no está publicado según plan.yaml` });
      }
      continue;
    }
    if (href.startsWith("/")) continue;
    if (!href.startsWith("https://")) {
      errors.push({ rule: "links", line: link.line, message: `link "${href}": los externos tienen que ser https:// y los internos empezar con /` });
    }
  }

  // --- Largo -----------------------------------------------------------------
  const words = countWords(parsed.blocks);
  if (words < MIN_WORDS) warnings.push({ rule: "words", message: `el cuerpo tiene ${words} palabras (mínimo sugerido ${MIN_WORDS})` });

  const byLine = (a: Issue, b: Issue): number => (a.line ?? 0) - (b.line ?? 0);
  return { errors: errors.sort(byLine), warnings: warnings.sort(byLine), frontmatter, parsed };
}

export function formatIssues(result: Pick<ValidationResult, "errors" | "warnings">, file: string): string {
  const lines: string[] = [];
  const fmt = (level: string, issue: Issue): string =>
    `${level} ${file}${issue.line ? `:${issue.line}` : ""} [${issue.rule}] ${issue.message}`;
  for (const issue of result.errors) lines.push(fmt("ERROR", issue));
  for (const issue of result.warnings) lines.push(fmt("WARN ", issue));
  lines.push(`${result.errors.length} error(es), ${result.warnings.length} warning(s)`);
  return lines.join("\n");
}
