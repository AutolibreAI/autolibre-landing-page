import { cache } from "react";
import type {
  EmbedReferences,
  RichTextContent,
} from "@graphcms/rich-text-types";
import { hygraphFetch } from "@/lib/hygraph/client";
import {
  toSeo,
  type BlogCategory,
  type BlogSeo,
  type RawSeo,
} from "@/lib/hygraph/posts";
import { hasText } from "@/lib/hygraph/toc";

/**
 * Modelo `Category` de Hygraph (API ID `Category`, plural `categories`).
 * Campos esperados:
 *
 *   name         Single line text   (obligatorio)
 *   slug         Slug               (obligatorio, único) — define la URL
 *                                     `/blog/[slug]`
 *   description  Single line text   (opcional: bajada corta del header y
 *                                     meta description si no hay `seo`)
 *   content      Rich text          (opcional: texto de la página pilar,
 *                                     SIN embeds: en este schema el campo
 *                                     no expone `references` y pedirlo hace
 *                                     fallar la query entera. Si se habilitan
 *                                     Embeds > Assets, sumar `references`
 *                                     acá, como en `POST_QUERY`)
 *   seo          Component `Seo`    (opcional: `metaTitle` y
 *                                     `metaDescription` para Google)
 *
 * Qué categorías existen NO sale de acá sino de `collectCategories` (las que
 * tienen al menos un post publicado): esta query solo trae los datos propios
 * de una categoría que ya se sabe que existe.
 */

export interface BlogCategoryDetail extends BlogCategory {
  /** Bajada corta, trimeada; `""` si no se cargó. */
  readonly description: string;
  readonly seo: BlogSeo;
  /** Texto pilar, o `null` si la categoría no tiene (o quedó vacío). */
  readonly content: {
    readonly raw: RichTextContent;
    readonly references: EmbedReferences;
  } | null;
}

const CATEGORY_QUERY = /* GraphQL */ `
  query BlogCategory($slug: String!) {
    category(where: { slug: $slug }, stage: PUBLISHED) {
      slug
      name
      description
      seo {
        metaTitle
        metaDescription
      }
      content {
        raw
      }
    }
  }
`;

type RawCategory = {
  slug: string;
  name: string;
  description?: string | null;
  seo?: RawSeo;
  content?: { raw: RichTextContent } | null;
};

/**
 * Una categoría por slug, o `null` si no existe o no está publicada.
 *
 * Igual que `getPostBySlug`, un error de red SÍ tira: devolver `null`
 * convertiría una caída del CMS en un 404 cacheado. Tirando, Next sigue
 * sirviendo la última versión buena y reintenta en la próxima revalidación.
 *
 * `cache` de React deduplica la llamada entre `generateMetadata` y la página.
 */
export const getCategoryBySlug = cache(
  async (slug: string): Promise<BlogCategoryDetail | null> => {
    const data = await hygraphFetch<{ category: RawCategory | null }>(
      CATEGORY_QUERY,
      { slug },
    );
    const raw = data.category;
    if (!raw) return null;

    return {
      slug: raw.slug,
      name: raw.name,
      description: raw.description?.trim() ?? "",
      seo: toSeo(raw.seo),
      content: raw.content?.raw && hasText(raw.content.raw)
        ? { raw: raw.content.raw, references: [] }
        : null,
    };
  },
);
