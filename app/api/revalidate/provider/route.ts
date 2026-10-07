import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  PROVIDER_PROFILES_TAG,
  providerTag,
} from "@/lib/provider-profile/api";
import { isValidSlug } from "@/lib/provider-profile/slug";
import { secretMatches } from "@/lib/revalidation";

const MAX_PREVIOUS_SLUGS = 10;

/**
 * Aviso de cambio de un perfil de proveedor (contrato:
 * `specs/209-public-provider-profile/contracts/revalidation-webhook.md`).
 * Lo llama quien escribe el dato (hoy, el panel de operadores) para que el
 * cambio se vea en la página, en su imagen de vista previa y en el sitemap en
 * segundos, sin esperar la ventana de 10 minutos.
 *
 * SU PROPIO secreto (`PROVIDER_PROFILE_REVALIDATE_SECRET`), distinto del de
 * Hygraph: un secreto filtrado de un sistema no sirve para vaciar el caché del
 * otro. El cuerpo se valida ESTRICTAMENTE antes de tocar el caché: sin eso un
 * llamador autenticado podría crear etiquetas arbitrarias y crecer el índice
 * de caché sin límite.
 *
 *   POST /api/revalidate/provider
 *   x-revalidate-secret: <secreto>
 *   { "slug": "mecanica-barrancas-san-isidro", "previousSlugs": ["mecanica-barrancas"] }
 *
 * Es idempotente. No publica ni despublica: la visibilidad la decide el
 * backend; esto solo evita que se tarde en notarse.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.PROVIDER_PROFILE_REVALIDATE_SECRET?.trim();

  // Sin secreto configurado la ruta queda cerrada: mejor un 500 visible que un
  // endpoint público que cualquiera puede usar para vaciar el caché.
  if (!secret) {
    return NextResponse.json(
      { error: "PROVIDER_PROFILE_REVALIDATE_SECRET no está configurado." },
      { status: 500 },
    );
  }

  if (!secretMatches(request.headers.get("x-revalidate-secret"), secret)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo no es JSON válido." }, { status: 400 });
  }

  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const { slug, previousSlugs } = record;

  if (typeof slug !== "string" || !isValidSlug(slug)) {
    return NextResponse.json({ error: "`slug` es obligatorio y con formato de slug." }, { status: 400 });
  }

  let previous: string[] = [];
  if (previousSlugs !== undefined) {
    if (
      !Array.isArray(previousSlugs) ||
      previousSlugs.length > MAX_PREVIOUS_SLUGS ||
      !previousSlugs.every((value): value is string => typeof value === "string" && isValidSlug(value))
    ) {
      return NextResponse.json(
        { error: `\`previousSlugs\` debe ser una lista de hasta ${MAX_PREVIOUS_SLUGS} slugs válidos.` },
        { status: 400 },
      );
    }
    previous = previousSlugs;
  }

  // `{ expire: 0 }` y no `"max"`: con stale-while-revalidate la primera visita
  // después del cambio seguiría viendo la versión vieja.
  const tags = [...new Set([slug, ...previous])].map(providerTag);
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  revalidateTag(PROVIDER_PROFILES_TAG, { expire: 0 });

  return NextResponse.json({
    revalidated: true,
    tags: [...tags, PROVIDER_PROFILES_TAG],
    now: Date.now(),
  });
}
