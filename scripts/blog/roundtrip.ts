/**
 * Roundtrip del post recién creado en Hygraph: lee `content.raw` del stage
 * DRAFT por la Content API y compara su sha256 con el `contentHash` de
 * `content-pipeline/out/<slug>.json`.
 *
 *   npm run blog:roundtrip -- <slug> --id <postId> [--out <dir>]
 *
 * Necesita `HYGRAPH_ENDPOINT` y `HYGRAPH_TOKEN` (Permanent Auth Token con
 * lectura en DRAFT) en `.env.local` o `.env`. Solo lee: nunca escribe en Hygraph.
 * Guarda la respuesta en `<out>/<slug>.roundtrip.json`.
 *
 * Exit: 0 coincide · 1 no coincide (o error de la API) · 2 falta token/endpoint o uso inválido.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs, stringFlag } from "./lib/context.ts";
import { compareRoundtrip, ROUNDTRIP_QUERY } from "./lib/roundtrip.ts";
import { REPO_ROOT } from "./lib/sources.ts";

for (const file of [".env.local", ".env"]) {
  const envPath = path.join(REPO_ROOT, file);
  if (existsSync(envPath)) process.loadEnvFile(envPath);
}

async function main(): Promise<number> {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const slug = positional[0];
  const id = stringFlag(flags, "id");
  if (!slug || !id) {
    console.error("uso: npm run blog:roundtrip -- <slug> --id <postId> [--out <dir>]");
    return 2;
  }

  const token = process.env.HYGRAPH_TOKEN?.trim();
  const endpoint = process.env.HYGRAPH_ENDPOINT?.trim();
  if (!token || !endpoint) {
    console.error(
      "Falta HYGRAPH_TOKEN (con lectura en DRAFT) o HYGRAPH_ENDPOINT: roundtrip no automatizado, comparalo a mano.",
    );
    return 2;
  }

  const outDir = path.resolve(stringFlag(flags, "out") ?? path.join(REPO_ROOT, "content-pipeline", "out"));
  const payloadFile = path.join(outDir, `${slug}.json`);
  if (!existsSync(payloadFile)) {
    console.error(`no existe el payload: ${payloadFile} (corré blog:payload primero)`);
    return 2;
  }
  const { contentHash } = JSON.parse(readFileSync(payloadFile, "utf8")) as { contentHash?: string };
  if (!contentHash) {
    console.error(`${payloadFile} no tiene contentHash`);
    return 2;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: ROUNDTRIP_QUERY, variables: { id } }),
  });
  const body = (await response.json().catch(() => ({}))) as { errors?: { message: string }[] };
  if (!response.ok || body.errors?.length) {
    const detail = body.errors?.map((e) => e.message).join("; ") ?? "sin detalle";
    console.error(`Hygraph ${response.status}: ${detail}`);
    return 1;
  }

  const roundtripFile = path.join(outDir, `${slug}.roundtrip.json`);
  writeFileSync(roundtripFile, `${JSON.stringify(body, null, 2)}\n`, "utf8");

  const result = compareRoundtrip(body, contentHash);
  if (result.status === "missing") {
    console.error(result.reason);
    return 1;
  }
  console.log(`roundtrip: ${path.relative(process.cwd(), roundtripFile)}`);
  console.log(`contentHash: ${result.expected}`);
  console.log(`roundtrip:   ${result.actual}`);
  console.log(result.status === "match" ? "OK: coinciden" : "DIFIEREN: revisá el diff, no toques el DRAFT");
  return result.status === "match" ? 0 : 1;
}

// exitCode y no exit(): en Windows, process.exit() con un fetch recién cerrado
// dispara un assert de libuv (UV_HANDLE_CLOSING).
main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  },
);
