#!/usr/bin/env node
/**
 * Servidor de prueba del contrato `GET /partner-profiles`
 * (specs/209-public-provider-profile/contracts/partner-profile-api.md).
 *
 * El backend todavía no tiene estos endpoints: la landing se desarrolla y se
 * verifica contra esto. Vive en `scripts/` (fuera del typecheck de Next) y NUNCA
 * se empaqueta con la app. Sin dependencias.
 *
 *   node scripts/provider-profile/mock-api.mjs          # escucha en :4020
 *   AUTOLIBRE_API_URL=http://localhost:4020 npm run dev
 *
 * Carga todos los `*.json` de `fixtures/` como perfiles (el archivo es el
 * `PartnerProfile` completo, tal cual lo devolvería el backend). `_moved.json`
 * mapea slugs históricos a vigentes: `{ "slug-viejo": "slug-vigente" }`.
 * `service-categories.json` no es un perfil y se ignora.
 */
import { createServer } from "node:http";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT ?? 4020);
const dir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

function load() {
  const profiles = new Map();
  let moved = {};
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json") || file === "service-categories.json") continue;
    const json = JSON.parse(readFileSync(join(dir, file), "utf8"));
    if (file === "_moved.json") {
      moved = json;
      continue;
    }
    profiles.set(json.slug, json);
  }
  return { profiles, moved };
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

createServer((req, res) => {
  // Se recarga en cada request: editar un fixture se ve sin reiniciar.
  const { profiles, moved } = load();
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname.replace(/\/+$/, "");

  if (req.method !== "GET") return send(res, 405, { statusCode: 405, message: "Method Not Allowed" });

  const one = path.match(/^\/api\/v1\/partner-profiles\/(.+)$/);
  if (one) {
    const slug = one[1];
    if (!SLUG.test(slug) || slug.length > 120) {
      return send(res, 400, { statusCode: 400, message: "slug inválido", error: "Bad Request" });
    }
    if (profiles.has(slug)) return send(res, 200, { status: "ok", profile: profiles.get(slug) });
    if (moved[slug] && profiles.has(moved[slug])) {
      return send(res, 200, { status: "moved", slug: moved[slug] });
    }
    return send(res, 404, { statusCode: 404, message: "No existe", error: "Not Found" });
  }

  if (path === "/api/v1/partner-profiles") {
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 50)));
    const category = url.searchParams.get("category");
    const locality = url.searchParams.get("locality");
    const slugify = (value) =>
      String(value ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const rows = [...profiles.values()]
      .filter((p) => !category || p.primaryCategory?.slug === category)
      .filter((p) => !locality || slugify(p.locality) === locality)
      // Orden total: aliados primero, luego nombre, desempate por slug.
      .sort(
        (a, b) =>
          Number(b.isAlly) - Number(a.isAlly) ||
          a.name.localeCompare(b.name, "es") ||
          a.slug.localeCompare(b.slug),
      )
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        isAlly: p.isAlly,
        logo: p.logo,
        primaryCategory: p.primaryCategory,
        locality: p.locality,
        rating: p.reviews && p.reviews.count > 0 ? { average: p.reviews.average, count: p.reviews.count } : null,
        indexable: p.indexable,
        updatedAt: p.updatedAt,
      }));

    const start = (page - 1) * pageSize;
    return send(res, 200, {
      data: rows.slice(start, start + pageSize),
      total: rows.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(rows.length / pageSize)),
    });
  }

  return send(res, 404, { statusCode: 404, message: "Ruta inexistente en el servidor de prueba", error: "Not Found" });
}).listen(PORT, () => {
  console.log(`Servidor de prueba del contrato en http://localhost:${PORT}/api/v1`);
});
