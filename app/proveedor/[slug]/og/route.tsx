/* eslint-disable @next/next/no-img-element --
   `ImageResponse` (Satori) solo renderiza `<img>` de HTML: `next/image` no existe
   dentro de esta imagen. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import {
  fillTemplate,
  providerProfileContent as copy,
} from "@/lib/content/provider-profile";
import {
  getProviderProfile,
  listAllProviderSummaries,
} from "@/lib/provider-profile/api";
import {
  OG_COLORS,
  OG_COVER_WIDTH,
  OG_SIZE,
} from "@/lib/provider-profile/og-tokens";
import {
  categoryAndLocality,
  ratingText,
  safeExternalUrl,
} from "@/lib/provider-profile/present";

/**
 * Imagen de vista previa por proveedor (1200×630): logo, nombre, "rubro ·
 * localidad", puntuación, sello Aliado, logo de AutoLibre y la portada a la
 * derecha. Es lo que se ve cuando el link se comparte por WhatsApp.
 *
 * Caché: ISR de 10 minutos, igual que la página. Las lecturas del backend van
 * etiquetadas con `provider:<slug>`, así que el aviso de cambio
 * (`/api/revalidate/provider`) renueva página e imagen juntas. Por eso este
 * handler NO lee el `Request` (haría la ruta dinámica y se perdería el caché).
 *
 * Degradación (FR-042): sin portada → panel liso; sin logo → se omite el
 * cuadro; sin reseñas → se omite la fila de puntuación; sin sello → se omite;
 * una imagen que no se puede leer o que Satori no soporta (p. ej. WebP) se
 * omite SIN romper la tarjeta; nombre largo → 2 líneas con elipsis; slug
 * inexistente → 404.
 *
 * Fuentes: la de `ImageResponse` por defecto. Outfit y DM Sans necesitan
 * archivos `ttf` propios (no `woff2`) y su peso cuenta para el límite de 500 KB
 * del bundle: queda como mejora pendiente de confirmar (research D11).
 */
export const revalidate = 600;

/**
 * Prerenderiza la imagen de los perfiles existentes (misma lista que la
 * página); el resto se genera en el primer pedido y queda cacheado. Sin esto
 * la ruta es 100% dinámica y cada scraper de WhatsApp la regenera.
 */
export async function generateStaticParams() {
  const summaries = await listAllProviderSummaries();
  return summaries.map((summary) => ({ slug: summary.slug }));
}

const MAX_IMAGE_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 4_000;
const PUBLIC_DIR = path.join(process.cwd(), "public");

const MIME_BY_EXT: Readonly<Record<string, string>> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function toDataUri(mime: string, bytes: ArrayBuffer | Buffer): string {
  return `data:${mime};base64,${Buffer.from(bytes as ArrayBuffer).toString("base64")}`;
}

/**
 * Lee una imagen y la devuelve como data URI, o `null` si no se puede usar.
 * Solo PNG y JPEG (lo que Satori soporta), de hasta 1,5 MB. Una ruta relativa
 * se lee de `public/` (sin salir de ese directorio).
 */
async function loadImage(url: string): Promise<string | null> {
  try {
    if (url.startsWith("/")) {
      const file = path.normalize(path.join(PUBLIC_DIR, url));
      const mime = MIME_BY_EXT[path.extname(file).toLowerCase()];
      if (!mime || !file.startsWith(PUBLIC_DIR + path.sep)) return null;
      return toDataUri(mime, await readFile(file));
    }

    const safe = safeExternalUrl(url);
    if (!safe) return null;
    const response = await fetch(safe, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    const mime = response.headers.get("content-type")?.split(";")[0]?.trim();
    if (!response.ok || !mime || !["image/png", "image/jpeg"].includes(mime)) return null;
    const bytes = await response.arrayBuffer();
    return bytes.byteLength <= MAX_IMAGE_BYTES ? toDataUri(mime, bytes) : null;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const result = await getProviderProfile(slug);
  if (result.status !== "ok") return new Response("No encontrado", { status: 404 });

  const { profile } = result;
  const [logo, cover, lockup, isotype] = await Promise.all([
    profile.logo ? loadImage(profile.logo.url) : null,
    profile.cover ? loadImage(profile.cover.url) : null,
    loadImage("/brand/lockup-light.png"),
    profile.isAlly ? loadImage("/brand/isotype.png") : null,
  ]);

  const reviews = profile.reviews;
  const hasRating = reviews !== null && reviews.count > 0;
  const subtitle = categoryAndLocality(profile);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: OG_COLORS.background,
          color: OG_COLORS.ink,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: 64,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {logo ? (
              <img
                src={logo}
                alt=""
                width={120}
                height={120}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 24,
                  border: `1px solid ${OG_COLORS.border}`,
                  objectFit: "cover",
                }}
              />
            ) : null}
            <div
              style={{
                display: "flex",
                marginTop: logo ? 32 : 0,
                fontSize: 64,
                fontWeight: 700,
                lineHeight: 1.1,
                lineClamp: 2,
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {profile.name}
            </div>
            {subtitle ? (
              <div style={{ display: "flex", marginTop: 16, fontSize: 28, color: OG_COLORS.inkSoft }}>
                {subtitle}
              </div>
            ) : null}
            {hasRating && reviews ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: 20,
                  fontSize: 28,
                  color: OG_COLORS.inkSoft,
                }}
              >
                {/* Dibujada y no el glifo "★": la fuente por defecto no lo trae y sale un cuadrado. */}
                <svg width="30" height="30" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
                  <path
                    d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
                    fill={OG_COLORS.rating}
                  />
                </svg>
                <span style={{ fontWeight: 700, color: OG_COLORS.ink, marginRight: 12 }}>
                  {ratingText(reviews.average)}
                </span>
                <span>
                  {reviews.count === 1
                    ? copy.reviews.countOne
                    : fillTemplate(copy.reviews.count, { count: reviews.count })}
                </span>
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {profile.isAlly ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                  borderRadius: 999,
                  background: OG_COLORS.sealBackground,
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {isotype ? (
                  <img
                    src={isotype}
                    alt=""
                    width={26}
                    height={24}
                    style={{ width: 26, height: 24, marginRight: 10 }}
                  />
                ) : null}
                {copy.ally}
              </div>
            ) : (
              <div style={{ display: "flex" }} />
            )}
            {lockup ? (
              <img src={lockup} alt="" width={160} height={31} style={{ width: 160, height: 31 }} />
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: OG_COVER_WIDTH,
            height: "100%",
            background: OG_COLORS.coverPlaceholder,
          }}
        >
          {cover ? (
            <img
              src={cover}
              alt=""
              width={OG_COVER_WIDTH}
              height={OG_SIZE.height}
              style={{ width: OG_COVER_WIDTH, height: OG_SIZE.height, objectFit: "cover" }}
            />
          ) : null}
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
