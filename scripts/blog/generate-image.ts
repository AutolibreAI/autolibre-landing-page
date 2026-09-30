/**
 * Genera imágenes del blog con Nano Banana (Gemini image) usando el prompt base
 * de `content-pipeline/style.md` + la escena del post.
 *
 * Uso:
 *   npm run blog:image -- --scene "<escena en inglés>" --out content-pipeline/images/<slug>-cover [--count 2]
 *   npm run blog:image -- --list-models
 *
 * Escribe `<out>-1.png`, `<out>-2.png`, … La key sale de `NANOBANANA_API_KEY`
 * (en `.env.local`, que no se commitea). El modelo se puede cambiar con
 * `--model` o `NANOBANANA_MODEL`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs, stringFlag } from "./lib/context.ts";
import { REPO_ROOT } from "./lib/sources.ts";

const API = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-3.1-flash-image";
const STYLE_PATH = path.join(REPO_ROOT, "content-pipeline", "style.md");

for (const file of [".env.local", ".env"]) {
  const envPath = path.join(REPO_ROOT, file);
  if (existsSync(envPath)) process.loadEnvFile(envPath);
}

/** El bloque ```text``` que sigue a "## Prompt base", sin la línea `Scene:`. */
export function promptBase(styleMd: string): string {
  const section = styleMd.split(/^## Prompt base\s*$/m)[1];
  const block = section?.match(/```text\n([\s\S]*?)```/)?.[1];
  if (!block) throw new Error("style.md: no encontré el bloque de texto de '## Prompt base'");
  return block.replace(/^Scene:.*$/m, "").trim();
}

type Part = { text?: string; inlineData?: { mimeType: string; data: string } };
type GenerateResponse = {
  candidates?: { content?: { parts?: Part[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { message: string };
};

async function call<T>(url: string, key: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: { message: string } };
  if (!response.ok) throw new Error(`Gemini ${response.status}: ${payload.error?.message ?? "sin detalle"}`);
  return payload;
}

async function main(): Promise<number> {
  const { flags } = parseArgs(process.argv.slice(2), ["list-models"]);
  const key = process.env.NANOBANANA_API_KEY?.trim();
  if (!key) {
    console.error("Falta NANOBANANA_API_KEY (agregala en .env.local).");
    return 2;
  }

  if (flags.has("list-models")) {
    const { models = [] } = await call<{ models?: { name: string; supportedGenerationMethods?: string[] }[] }>(
      `${API}/models?pageSize=200`,
      key,
    );
    for (const m of models.filter((m) => /image/i.test(m.name))) console.log(m.name);
    return 0;
  }

  const scene = stringFlag(flags, "scene");
  const out = stringFlag(flags, "out");
  if (!scene || !out) {
    console.error('Uso: --scene "<escena>" --out <ruta sin extensión> [--count N] [--model id] [--aspect 16:9]');
    return 2;
  }
  const model = stringFlag(flags, "model") ?? process.env.NANOBANANA_MODEL ?? DEFAULT_MODEL;
  const count = Math.min(Math.max(Number(stringFlag(flags, "count") ?? "2") || 2, 1), 4);
  const aspectRatio = stringFlag(flags, "aspect") ?? "16:9";
  const prompt = `${promptBase(readFileSync(STYLE_PATH, "utf8"))}\nScene: ${scene}`;

  const outPath = path.resolve(REPO_ROOT, out);
  mkdirSync(path.dirname(outPath), { recursive: true });

  // Una request por variante: el endpoint devuelve una imagen por respuesta.
  for (let i = 1; i <= count; i++) {
    const result = await call<GenerateResponse>(`${API}/models/${model}:generateContent`, key, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio } },
    });
    const image = result.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!image) {
      const reason = result.promptFeedback?.blockReason ?? result.candidates?.[0]?.finishReason ?? "sin imagen";
      console.error(`variante ${i}: el modelo no devolvió imagen (${reason})`);
      continue;
    }
    const ext = image.mimeType === "image/jpeg" ? "jpg" : "png";
    const file = `${outPath}-${i}.${ext}`;
    writeFileSync(file, Buffer.from(image.data, "base64"));
    console.log(path.relative(REPO_ROOT, file));
  }
  return 0;
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
