import { sha256 } from "./payload.ts";

/**
 * Lógica pura del roundtrip: saca `content.raw` de la respuesta de la Content
 * API y lo compara (sha256 del JSON canónico) con el `contentHash` del payload.
 */

export const ROUNDTRIP_QUERY = /* GraphQL */ `query Roundtrip($id: ID!) {
  post(where: { id: $id }, stage: DRAFT) {
    id
    stage
    content {
      raw
    }
  }
}`;

export type RoundtripResult =
  | { readonly status: "match"; readonly actual: string; readonly expected: string }
  | { readonly status: "mismatch"; readonly actual: string; readonly expected: string }
  | { readonly status: "missing"; readonly reason: string };

/** Acepta `{data:{post}}` (respuesta GraphQL) o `{post}`. */
export function extractRaw(response: unknown): unknown {
  const root = response as { data?: { post?: unknown }; post?: unknown } | null;
  const post = (root?.data?.post ?? root?.post) as { content?: { raw?: unknown } } | null | undefined;
  return post?.content?.raw;
}

export function compareRoundtrip(response: unknown, expected: string): RoundtripResult {
  const raw = extractRaw(response);
  if (raw === undefined || raw === null) {
    return { status: "missing", reason: "la respuesta no trae post.content.raw (¿id equivocado o post inexistente en DRAFT?)" };
  }
  const actual = sha256(raw);
  return { status: actual === expected ? "match" : "mismatch", actual, expected };
}
