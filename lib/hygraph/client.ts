/**
 * Cliente mínimo de la Content API de Hygraph (GraphQL sobre fetch).
 *
 * No usa `graphql-request` ni Apollo: el blog hace tres queries de lectura y
 * un cliente entero solo sumaría bundle de servidor y una dependencia más. Lo
 * único que hace falta es que el `fetch` pase por el data cache de Next, y
 * eso lo da el `fetch` nativo con `next.revalidate` / `next.tags`.
 *
 * Server-only a propósito: ni el endpoint ni el token llevan `NEXT_PUBLIC_`.
 */

/** Tag de todo lo que viene de Hygraph. La ruta de webhook invalida este tag. */
export const HYGRAPH_CACHE_TAG = "hygraph";

/**
 * Ventana de revalidación por tiempo. Es la red de seguridad por si el
 * webhook falla: el camino normal es la invalidación on-demand, así que
 * un post publicado aparece en segundos y no en esta ventana.
 */
const REVALIDATE_SECONDS = 300;

function endpoint(): string {
  const url = process.env.HYGRAPH_ENDPOINT?.trim();

  if (!url) {
    throw new Error(
      "Falta HYGRAPH_ENDPOINT: es la Content API URL (Project settings > Endpoints).",
    );
  }

  return url;
}

/**
 * Reintentos ante un rechazo transitorio de Hygraph. El plan limita las
 * requests por segundo que no salen del cache del CDN: el build pre-renderiza
 * todas las notas y categorías en paralelo (una query distinta por página) y
 * se pasaba del límite con un 429. Reintentar espaciado alcanza; el límite es
 * por segundo, no una cuota agotada.
 *
 * Es seguro reintentar con las mismas opciones de `fetch`: Next solo guarda
 * en su data cache respuestas 200 (`patch-fetch`), así que un 429 no queda
 * cacheado y el reintento exitoso sí.
 */
const MAX_ATTEMPTS = 5;
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 8_000;

/**
 * Espera antes del reintento `attempt` (1, 2, ...): lo que pida `Retry-After`
 * si viene, si no backoff exponencial (0,5 s, 1 s, 2 s, 4 s) con jitter para
 * que las páginas que se frenaron juntas no vuelvan a salir juntas.
 */
function retryDelay(attempt: number, retryAfter: string | null): number {
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds * 1000, MAX_DELAY_MS);

  const exponential = BASE_DELAY_MS * 2 ** (attempt - 1);
  return Math.min(exponential + Math.random() * BASE_DELAY_MS, MAX_DELAY_MS);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type GraphQLResponse<T> = {
  readonly data?: T;
  readonly errors?: readonly { readonly message: string }[];
};

/**
 * Ejecuta una query y devuelve `data`. Tira si el endpoint falta, si responde
 * no-2xx o si GraphQL devuelve `errors`: quien llama decide cómo degradar
 * (ver `lib/hygraph/posts.ts`, que loguea y devuelve vacío / `null`).
 */
export async function hygraphFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const token = process.env.HYGRAPH_TOKEN?.trim();
  const url = endpoint();
  const init: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // El token es opcional: solo hace falta si el proyecto no le dio
      // permiso de lectura pública a la Content API.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    // En desarrollo no se cachea: el fetch cache de Next también rige en
    // `next dev`, y Hygraph responde 200 aun cuando devuelve `errors` (por
    // ejemplo "not allowed" mientras se editan permisos), así que un error
    // transitorio quedaba pegado los 5 minutos de la ventana. Sin cache, cada
    // cambio de schema o de contenido se ve al recargar.
    ...(process.env.NODE_ENV === "development"
      ? { cache: "no-store" as const }
      : { next: { revalidate: REVALIDATE_SECONDS, tags: [HYGRAPH_CACHE_TAG] } }),
  };

  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, init);

    if (RETRYABLE_STATUS.has(response.status) && attempt < MAX_ATTEMPTS) {
      // Se descarta el body para liberar la conexión antes de esperar.
      await response.body?.cancel().catch(() => {});
      await sleep(retryDelay(attempt, response.headers.get("retry-after")));
      continue;
    }

    // Hygraph responde 400 con el detalle en el body (ej. "field 'x' is not
    // defined in 'Post'"): se parsea igual para que el log diga qué falló y no
    // solo el código de estado.
    const payload = (await response
      .json()
      .catch(() => ({}))) as GraphQLResponse<T>;

    if (!response.ok || payload.errors?.length || !payload.data) {
      const detail = payload.errors?.map((e) => e.message).join("; ");
      const retries = attempt > 1 ? ` (tras ${attempt} intentos)` : "";
      throw new Error(
        `Hygraph respondió ${response.status}${retries}${detail ? `: ${detail}` : ""}`,
      );
    }

    return payload.data;
  }
}
