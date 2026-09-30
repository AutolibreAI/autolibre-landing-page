import { createHash } from "node:crypto";
import { extractFaq } from "../../../lib/blog/faq.ts";
import type { PipelineContext } from "./context.ts";
import { FAQ_HEADING, faqQuestions, validateDraft, type Issue, type ValidationResult } from "./rules.ts";
import { assertSlate, mdToSlate, normalizeImageRef, type SlateContent } from "./slate.ts";

/**
 * validate → mdToSlate → assertSlate → extractFaq → payload de `createPost`.
 * El payload es la MISMA mutation + variables que se corren primero con
 * `dry_run` y después de verdad: paridad exacta entre prueba y escritura.
 */

export const CREATE_POST_MUTATION = /* GraphQL */ `mutation CreatePost($data: PostCreateInput!) {
  createPost(data: $data) {
    id
    slug
    stage
    content {
      raw
    }
  }
}`;

export interface RelationIds {
  /** Id de la Category en Hygraph. Sin él, se conecta por `slug`. */
  readonly categoryId?: string;
  /** Ids de los Tags, en el orden del frontmatter. Sin ellos, se conectan por `slug`. */
  readonly tagIds?: readonly string[];
}

export interface PostPayload {
  readonly slug: string;
  /** sha256 del JSON canónico de `variables.data`. */
  readonly hash: string;
  /** sha256 del JSON canónico de `content`: el roundtrip lo compara con `content.raw`. */
  readonly contentHash: string;
  readonly faqCount: number;
  readonly mutation: string;
  readonly variables: { readonly data: Record<string, unknown> };
}

export interface BuildResult {
  readonly payload: PostPayload | null;
  readonly errors: readonly Issue[];
  readonly validation: ValidationResult;
}

/** JSON con claves ordenadas: el mismo árbol da el mismo string venga de donde venga. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export interface BuildInput {
  readonly file: string;
  readonly source: string;
  readonly context: PipelineContext;
  readonly relations?: RelationIds;
}

export function buildPayload(input: BuildInput): BuildResult {
  const validation = validateDraft({
    file: input.file,
    source: input.source,
    plan: input.context.plan,
    sources: input.context.sources,
    today: input.context.today,
  });
  const errors: Issue[] = [...validation.errors];
  const fm = validation.frontmatter;
  if (errors.length > 0 || !fm) return { payload: null, errors, validation };

  if (!fm.cover.assetId) {
    errors.push({ rule: "cover", message: "falta `cover.assetId`: la cover se sube a Hygraph antes de crear el Post" });
  }
  const assetIds = new Map<string, string>();
  for (const img of fm.images) {
    if (img.assetId) assetIds.set(normalizeImageRef(img.file), img.assetId);
  }

  let content: SlateContent;
  try {
    content = mdToSlate(validation.parsed.blocks, { assetIds });
    assertSlate(content);
  } catch (err) {
    errors.push({ rule: "slate", message: err instanceof Error ? err.message : String(err) });
    return { payload: null, errors, validation };
  }

  const expectedFaq = faqQuestions(validation.parsed.blocks)?.length ?? 0;
  const faq = extractFaq(content, FAQ_HEADING);
  if (faq.length !== expectedFaq) {
    errors.push({
      rule: "faq",
      message: `extractFaq encontró ${faq.length} preguntas y el Markdown tiene ${expectedFaq}: el FAQPage no saldría completo`,
    });
  }

  const tagIds = input.relations?.tagIds;
  if (tagIds && tagIds.length !== fm.tags.length) {
    errors.push({ rule: "tags", message: `se pasaron ${tagIds.length} tagIds y el frontmatter tiene ${fm.tags.length} tags` });
  }

  if (errors.length > 0) return { payload: null, errors, validation };

  const categoryId = input.relations?.categoryId;
  const data: Record<string, unknown> = {
    title: fm.title,
    slug: fm.slug,
    excerpt: fm.excerpt,
    // `date` es obligatorio en el modelo y ordena el listado: sin fecha propia, usa la de revisión.
    date: fm.date ?? fm.reviewedAt,
    reviewedAt: fm.reviewedAt,
    sourceIds: [...fm.sourceIds],
    seo: { create: { metaTitle: fm.metaTitle, metaDescription: fm.metaDescription } },
    content,
    category: { connect: categoryId ? { id: categoryId } : { slug: fm.category } },
    tags: { connect: tagIds ? tagIds.map((id) => ({ id })) : fm.tags.map((slug) => ({ slug })) },
    coverImage: { connect: { id: fm.cover.assetId } },
  };

  return {
    payload: {
      slug: fm.slug,
      hash: sha256(data),
      contentHash: sha256(content),
      faqCount: faq.length,
      mutation: CREATE_POST_MUTATION,
      variables: { data },
    },
    errors,
    validation,
  };
}
