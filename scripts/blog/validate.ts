/**
 * Valida un draft del blog contra el subset de Markdown, el plan y la fuente
 * de verdad.
 *
 *   node scripts/blog/validate.ts content-pipeline/drafts/<slug>.md [--json]
 *     [--plan content-pipeline/plan.yaml] [--sources <fuente.md>] [--today YYYY-MM-DD]
 *
 * Sale con 1 si hay errores (los warnings no frenan). La fuente de verdad sale
 * de `BLOG_SOURCE_OF_TRUTH` o, por defecto, de
 * `../autolibre-fuente-verdad-documental-amba.md` (al lado del repo).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { ContextError, loadContext, parseArgs, stringFlag } from "./lib/context.ts";
import { formatIssues, validateDraft } from "./lib/rules.ts";

function main(): number {
  const { positional, flags } = parseArgs(process.argv.slice(2), ["json"]);
  const file = positional[0];
  if (!file) {
    console.error("uso: node scripts/blog/validate.ts <draft.md> [--json] [--plan <plan.yaml>] [--sources <fuente.md>]");
    return 2;
  }

  const draftPath = path.resolve(file);
  let context;
  try {
    context = loadContext({
      planPath: stringFlag(flags, "plan"),
      sourcesPath: stringFlag(flags, "sources"),
      today: stringFlag(flags, "today"),
    });
  } catch (err) {
    if (err instanceof ContextError) {
      console.error(err.message);
      return 2;
    }
    throw err;
  }

  const result = validateDraft({ file: draftPath, source: readFileSync(draftPath, "utf8"), ...context });

  if (flags.get("json") === true) {
    console.log(
      JSON.stringify({ file, ok: result.errors.length === 0, errors: result.errors, warnings: result.warnings }, null, 2),
    );
  } else {
    console.log(formatIssues(result, file));
  }
  return result.errors.length > 0 ? 1 : 0;
}

process.exitCode = main();
