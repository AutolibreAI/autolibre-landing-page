/**
 * Arma el payload de `createPost` de un draft validado y lo escribe en
 * `content-pipeline/out/<slug>.json` (mutation + variables + hashes).
 *
 *   node scripts/blog/build-payload.ts content-pipeline/drafts/<slug>.md
 *     [--category-id <id>] [--tag-ids <id,id>] [--out <dir>]
 *     [--plan <plan.yaml>] [--sources <fuente.md>] [--today YYYY-MM-DD]
 *
 * Corre `validate` primero: si hay errores no escribe nada y sale con 1. La
 * cover (y las imágenes inline) tienen que tener `assetId` en el frontmatter.
 * Sin `--category-id`/`--tag-ids`, las relaciones se conectan por `slug`.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ContextError, loadContext, parseArgs, stringFlag } from "./lib/context.ts";
import { buildPayload } from "./lib/payload.ts";
import { formatIssues } from "./lib/rules.ts";
import { REPO_ROOT } from "./lib/sources.ts";

function main(): number {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const file = positional[0];
  if (!file) {
    console.error(
      "uso: node scripts/blog/build-payload.ts <draft.md> [--category-id <id>] [--tag-ids <id,id>] [--out <dir>]",
    );
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

  const tagIdsFlag = stringFlag(flags, "tag-ids");
  const result = buildPayload({
    file: draftPath,
    source: readFileSync(draftPath, "utf8"),
    context,
    relations: {
      categoryId: stringFlag(flags, "category-id"),
      tagIds: tagIdsFlag ? tagIdsFlag.split(",").map((id) => id.trim()).filter(Boolean) : undefined,
    },
  });

  if (!result.payload) {
    console.error(formatIssues({ errors: result.errors, warnings: result.validation.warnings }, file));
    return 1;
  }

  const outDir = path.resolve(stringFlag(flags, "out") ?? path.join(REPO_ROOT, "content-pipeline", "out"));
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${result.payload.slug}.json`);
  writeFileSync(outFile, `${JSON.stringify(result.payload, null, 2)}\n`, "utf8");

  if (result.validation.warnings.length > 0) {
    console.log(formatIssues({ errors: [], warnings: result.validation.warnings }, file));
  }
  console.log(`payload: ${path.relative(process.cwd(), outFile)}`);
  console.log(`hash: ${result.payload.hash}`);
  console.log(`contentHash: ${result.payload.contentHash}`);
  console.log(`faq: ${result.payload.faqCount} pregunta(s)`);
  return 0;
}

process.exitCode = main();
