import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PipelineContext } from "../lib/context.ts";
import { parsePlan, type Plan } from "../lib/plan.ts";
import { parseSources, type SourceEntry } from "../lib/sources.ts";

export const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "__fixtures__");
export const TODAY = "2026-09-30";

export function fixture(name: string): string {
  return readFileSync(path.join(FIXTURES, name), "utf8").replace(/\r\n?/g, "\n");
}

export function fixturePath(name: string): string {
  return path.join(FIXTURES, name);
}

export function loadPlan(): Plan {
  const { plan, errors } = parsePlan(fixture("plan.yaml"));
  if (!plan) throw new Error(`plan fixture inválido: ${errors.join("; ")}`);
  return plan;
}

export function loadSourcesFixture(): Map<string, SourceEntry> {
  return parseSources(fixture("sources.md"));
}

export function testContext(): PipelineContext {
  return { plan: loadPlan(), sources: loadSourcesFixture(), today: TODAY };
}

/** El draft válido con `snippet` agregado al final, separado por una línea en blanco. */
export function validWith(snippet: string): { source: string; snippetLine: number } {
  const base = fixture("valid-full.md").replace(/\n+$/, "\n");
  const snippetLine = base.split("\n").length + 1;
  return { source: `${base}\n${snippet}`, snippetLine };
}
