#!/usr/bin/env node
/**
 * Verifica que el <header> sea el mismo en todas las páginas del sitio.
 *
 * Uso (con el sitio levantado, p. ej. `npm run build && npm start`):
 *   node scripts/site-nav/check-header.mjs http://localhost:3000
 *
 * Contrato: specs/210-header-hero-clarity/contracts/header-nav.md. Para cada
 * ruta saca los links del primer <header> (texto + href, en orden) y los
 * compara contra los de la home. Las ÚNICAS diferencias permitidas son el
 * botón de la derecha de `/proveedores` y `/pedido` (EXCEPTIONS). `/descarga`
 * no se compara: su encabezado es mínimo a propósito.
 *
 * Es una herramienta de verificación: no se empaqueta con la app ni corre en
 * `next build`. Sin dependencias.
 */

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

/** Rutas fijas. Se suman una categoría y un post del blog si los hay. */
const STATIC_ROUTES = [
  "/",
  "/pedido",
  "/proveedores",
  "/sobre-nosotros",
  "/support",
  "/eliminar-cuenta",
  "/terminos",
  "/privacidad",
  "/blog",
];

/**
 * Páginas que pueden diferir SOLO en el botón de la derecha (el último link
 * del header que no es de la lista maestra). Se detecta comparando contra la
 * home: se permite que difiera exactamente un link, el del botón.
 */
const CTA_EXCEPTIONS = new Set(["/proveedores", "/pedido"]);

async function getHtml(path) {
  const res = await fetch(`${base}${path}`, { redirect: "follow" });
  if (!res.ok) throw new Error(`${path} respondió ${res.status}`);
  return res.text();
}

/** Primer <header>…</header> del HTML (el del sitio). */
function headerOf(html) {
  const match = html.match(/<header[\s\S]*?<\/header>/i);
  return match ? match[0] : null;
}

function decode(text) {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Lista ordenada de "texto → href" de los links del header. */
function linksOf(header) {
  const links = [];
  const re = /<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(header))) {
    const text = decode(m[2]);
    // El logo no tiene texto (es una imagen con `alt`): se compara por href.
    links.push(`${text || "(logo)"} → ${m[1]}`);
  }
  return links;
}

async function discoverBlogRoutes() {
  const routes = [];
  try {
    const html = await getHtml("/blog");
    const posts = [...html.matchAll(/href="(\/blog\/[^"/]+\/[^"/]+)"/g)].map(
      (m) => m[1],
    );
    const categories = [...html.matchAll(/href="(\/blog\/[^"/]+)"/g)]
      .map((m) => m[1])
      .filter((href) => !href.endsWith("rss.xml"));
    if (categories[0]) routes.push(categories[0]);
    if (posts[0]) routes.push(posts[0]);
    if (routes.length < 2) {
      console.warn("Aviso: no se encontró categoría o post del blog para comparar.");
    }
  } catch (error) {
    console.warn(`Aviso: no se pudo descubrir rutas del blog (${error.message}).`);
  }
  return routes;
}

const routes = [...STATIC_ROUTES, ...(await discoverBlogRoutes())];
const reference = linksOf(headerOf(await getHtml("/")) ?? "");
if (reference.length === 0) {
  console.error("No se encontraron links en el header de la home.");
  process.exit(2);
}

let failures = 0;
const rows = [];

for (const route of routes) {
  let links;
  try {
    const header = headerOf(await getHtml(route));
    if (!header) throw new Error("sin <header>");
    links = linksOf(header);
  } catch (error) {
    rows.push([route, `ERROR: ${error.message}`]);
    failures += 1;
    continue;
  }

  const missing = reference.filter((link) => !links.includes(link));
  const extra = links.filter((link) => !reference.includes(link));
  const orderOk =
    missing.length === 0 &&
    JSON.stringify(links.filter((l) => reference.includes(l))) ===
      JSON.stringify(reference.filter((l) => links.includes(l)));

  // Excepción: solo el botón de la derecha puede cambiar. El de descarga se
  // renderiza como dos links (App Store y Google Play; el cliente muestra el
  // que corresponde), por eso pueden faltar hasta 2 y sobrar 1.
  const ctaOnly =
    CTA_EXCEPTIONS.has(route) && missing.length <= 2 && extra.length <= 1;

  if ((missing.length === 0 && extra.length === 0 && orderOk) || ctaOnly) {
    rows.push([route, ctaOnly && (missing.length || extra.length) ? "OK (solo cambia el botón)" : "OK"]);
  } else {
    failures += 1;
    const detail = [
      missing.length ? `faltan: ${missing.join(" | ")}` : "",
      extra.length ? `sobran: ${extra.join(" | ")}` : "",
      !orderOk && missing.length === 0 ? "distinto orden" : "",
    ]
      .filter(Boolean)
      .join(" · ");
    rows.push([route, `DIFIERE — ${detail}`]);
  }
}

console.log(`Referencia (/): ${reference.length} links`);
for (const [route, status] of rows) console.log(`${route.padEnd(36)} ${status}`);

if (failures > 0) {
  console.error(`\n${failures} página(s) con un header distinto.`);
  process.exit(1);
}
console.log("\nTodas las páginas tienen el mismo header.");
