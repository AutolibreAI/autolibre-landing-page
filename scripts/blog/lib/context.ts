import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parsePlan, type Plan } from "./plan.ts";
import { defaultSourcesPath, loadSources, REPO_ROOT, type SourceEntry } from "./sources.ts";

/** Lo que necesitan las CLIs (`validate`, `build-payload`) además del draft. */
export interface PipelineContext {
  readonly plan: Plan;
  readonly sources: ReadonlyMap<string, SourceEntry>;
  readonly today: string;
}

export interface ContextOptions {
  readonly planPath?: string;
  readonly sourcesPath?: string;
  readonly today?: string;
}

export const DEFAULT_PLAN_PATH = path.join(REPO_ROOT, "content-pipeline", "plan.yaml");

export class ContextError extends Error {}

export function loadContext(options: ContextOptions = {}): PipelineContext {
  const planPath = options.planPath ?? DEFAULT_PLAN_PATH;
  if (!existsSync(planPath)) throw new ContextError(`no existe el plan: ${planPath}`);
  const { plan, errors } = parsePlan(readFileSync(planPath, "utf8"));
  if (!plan) throw new ContextError(`plan.yaml inválido (${planPath}):\n- ${errors.join("\n- ")}`);

  const sourcesPath = options.sourcesPath ?? defaultSourcesPath();
  if (!existsSync(sourcesPath)) {
    throw new ContextError(`no existe la fuente de verdad: ${sourcesPath} (configurá BLOG_SOURCE_OF_TRUTH)`);
  }
  const sources = loadSources(sourcesPath);

  return { plan, sources, today: options.today ?? new Date().toISOString().slice(0, 10) };
}

/** Parser mínimo de flags `--clave valor` / `--flag` para las CLIs. */
export function parseArgs(
  argv: readonly string[],
  booleans: readonly string[] = [],
): { positional: string[]; flags: Map<string, string | true> } {
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const eq = arg.indexOf("=");
    if (eq !== -1) {
      flags.set(arg.slice(2, eq), arg.slice(eq + 1));
      continue;
    }
    const next = argv[i + 1];
    if (!booleans.includes(arg.slice(2)) && next !== undefined && !next.startsWith("--")) {
      flags.set(arg.slice(2), next);
      i++;
    } else {
      flags.set(arg.slice(2), true);
    }
  }
  return { positional, flags };
}

export function stringFlag(flags: Map<string, string | true>, name: string): string | undefined {
  const value = flags.get(name);
  return typeof value === "string" ? value : undefined;
}
