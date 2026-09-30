import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { HYGRAPH_CACHE_TAG } from "@/lib/hygraph/client";

/** Comparación en tiempo constante: `===` filtra por timing cuántos chars coinciden. */
function secretMatches(received: string | null, expected: string): boolean {
  if (!received) return false;

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Webhook de Hygraph (Project settings > Webhooks). Al publicar, despublicar
 * o editar un post, una categoría o un tag invalida todo lo que se leyó de
 * Hygraph, así que el blog se actualiza en segundos sin esperar la ventana de
 * revalidación ni un deploy. Las categorías y los tags entran porque su
 * bajada, su SEO y el texto pilar se muestran en las páginas del blog.
 *
 * Configuración en Hygraph:
 *   URL      https://autolibre.ai/api/revalidate
 *   Método   POST
 *   Headers  x-revalidate-secret: <el valor de HYGRAPH_REVALIDATE_SECRET>
 *   Trigger  Models Post, Category, Tag · Stage Published ·
 *            Actions Publish, Unpublish, Update
 */
export async function POST(request: NextRequest) {
  const secret = process.env.HYGRAPH_REVALIDATE_SECRET?.trim();

  // Sin secreto configurado la ruta queda cerrada: mejor un 500 visible que
  // un endpoint público que cualquiera puede usar para vaciar el cache.
  if (!secret) {
    return NextResponse.json(
      { error: "HYGRAPH_REVALIDATE_SECRET no está configurado." },
      { status: 500 },
    );
  }

  if (!secretMatches(request.headers.get("x-revalidate-secret"), secret)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // `{ expire: 0 }` y no `"max"`: con stale-while-revalidate la primera visita
  // después de publicar seguiría viendo la versión vieja. Para un webhook la
  // doc de Next recomienda expirar de inmediato.
  revalidateTag(HYGRAPH_CACHE_TAG, { expire: 0 });

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
