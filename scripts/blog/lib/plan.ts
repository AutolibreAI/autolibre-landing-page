import { parse } from "yaml";

/**
 * `content-pipeline/plan.yaml`: el registro de los posts del blog y en qué
 * paso del pipeline está cada uno. `blockedBy` con texto = el pipeline se
 * niega a avanzar con ese post y muestra el motivo.
 */

export const PLAN_STATUSES = [
  "planned",
  "briefed",
  "drafted",
  "validated",
  "fact-checked",
  "images-ready",
  "hygraph-draft",
  "published",
] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const PLAN_PRIORITIES = ["P1", "P2", "P3"] as const;

export type PlanPriority = (typeof PLAN_PRIORITIES)[number];

export interface PlanPost {
  readonly slug: string;
  readonly title: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly priority: PlanPriority;
  readonly batch: number | null;
  readonly sourceIds: readonly string[];
  readonly status: PlanStatus;
  readonly blockedBy: string | null;
  readonly hygraphId: string | null;
}

export interface Plan {
  readonly version: number;
  readonly posts: readonly PlanPost[];
}

export interface PlanResult {
  readonly plan: Plan | null;
  readonly errors: readonly string[];
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function optionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text === "" ? null : text;
}

export function parsePlan(source: string): PlanResult {
  let data: unknown;
  try {
    data = parse(source);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { plan: null, errors: [`YAML inválido: ${message}`] };
  }

  const root = data as { version?: unknown; posts?: unknown } | null;
  if (!root || typeof root !== "object") {
    return { plan: null, errors: ["plan.yaml tiene que ser un objeto con `version` y `posts`"] };
  }

  const errors: string[] = [];
  if (root.version !== 1) errors.push("`version` tiene que ser 1");
  if (!Array.isArray(root.posts)) {
    errors.push("`posts` tiene que ser una lista");
    return { plan: null, errors };
  }

  const posts: PlanPost[] = [];
  const seen = new Set<string>();

  root.posts.forEach((raw: unknown, index: number) => {
    const where = `posts[${index}]`;
    const p = (raw ?? {}) as Record<string, unknown>;
    const slug = typeof p.slug === "string" ? p.slug.trim() : "";
    const label = slug ? `${where} (${slug})` : where;

    if (!slug) errors.push(`${where}: falta \`slug\``);
    else if (!SLUG_RE.test(slug)) errors.push(`${label}: \`slug\` tiene que ser kebab-case en minúsculas`);
    else if (seen.has(slug)) errors.push(`${label}: slug duplicado`);
    if (slug) seen.add(slug);

    if (typeof p.title !== "string" || p.title.trim() === "") errors.push(`${label}: falta \`title\``);
    if (typeof p.category !== "string" || p.category.trim() === "") errors.push(`${label}: falta \`category\``);
    if (p.tags !== undefined && !isStringArray(p.tags)) errors.push(`${label}: \`tags\` tiene que ser una lista de strings`);
    if (!isStringArray(p.sourceIds)) errors.push(`${label}: \`sourceIds\` tiene que ser una lista de strings`);

    const priority = p.priority as PlanPriority;
    if (!PLAN_PRIORITIES.includes(priority)) errors.push(`${label}: \`priority\` tiene que ser ${PLAN_PRIORITIES.join("|")}`);

    const status = p.status as PlanStatus;
    if (!PLAN_STATUSES.includes(status)) errors.push(`${label}: \`status\` tiene que ser ${PLAN_STATUSES.join("|")}`);

    if (p.blockedBy !== undefined && p.blockedBy !== null && typeof p.blockedBy !== "string") {
      errors.push(`${label}: \`blockedBy\` tiene que ser null o el motivo del bloqueo`);
    }
    if (p.batch !== undefined && p.batch !== null && (typeof p.batch !== "number" || !Number.isInteger(p.batch))) {
      errors.push(`${label}: \`batch\` tiene que ser un entero`);
    }

    posts.push({
      slug,
      title: typeof p.title === "string" ? p.title.trim() : "",
      category: typeof p.category === "string" ? p.category.trim() : "",
      tags: isStringArray(p.tags) ? p.tags : [],
      priority,
      batch: typeof p.batch === "number" ? p.batch : null,
      sourceIds: isStringArray(p.sourceIds) ? p.sourceIds : [],
      status,
      blockedBy: optionalText(p.blockedBy),
      hygraphId: optionalText(p.hygraphId),
    });
  });

  return { plan: errors.length === 0 ? { version: 1, posts } : null, errors };
}

export function findPost(plan: Plan, slug: string): PlanPost | undefined {
  return plan.posts.find((post) => post.slug === slug);
}

/**
 * Preflight del orquestador: `null` si el post puede avanzar, o el motivo por
 * el que no (no está en el plan o está bloqueado).
 */
export function blockReason(plan: Plan, slug: string): string | null {
  const post = findPost(plan, slug);
  if (!post) return `el slug "${slug}" no está en plan.yaml`;
  if (post.blockedBy) return `"${slug}" está bloqueado: ${post.blockedBy}`;
  return null;
}
