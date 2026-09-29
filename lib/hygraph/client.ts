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

  const response = await fetch(endpoint(), {
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
  });

  // Hygraph responde 400 con el detalle en el body (ej. "field 'x' is not
  // defined in 'Post'"): se parsea igual para que el log diga qué falló y no
  // solo el código de estado.
  const payload = (await response
    .json()
    .catch(() => ({}))) as GraphQLResponse<T>;

  if (!response.ok || payload.errors?.length || !payload.data) {
    const detail = payload.errors?.map((e) => e.message).join("; ");
    throw new Error(
      `Hygraph respondió ${response.status}${detail ? `: ${detail}` : ""}`,
    );
  }

  return payload.data;
}
