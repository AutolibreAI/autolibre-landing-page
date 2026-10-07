import "server-only";
import { apiBaseUrl } from "@/lib/autolibre-api";
import { isValidSlug } from "@/lib/provider-profile/slug";
import type {
  PartnerProfile,
  PartnerProfileList,
  PartnerProfileSummary,
  ProfileResult,
} from "@/lib/provider-profile/types";

/**
 * Lecturas del backend para el perfil público (contrato:
 * `specs/209-public-provider-profile/contracts/partner-profile-api.md`).
 *
 * Server-only. Cacheo con el data cache de Next: `revalidate: 600` es el tope
 * de retraso de SC-007 y las etiquetas permiten invalidar por evento
 * (`app/api/revalidate/provider/route.ts`).
 *
 * Semántica de error (research D5):
 * - `404` → `not_found` (la página responde 404).
 * - Backend caído o respuesta rara → TIRA. Next conserva la última página
 *   buena en vez de cachear un 404 falso.
 */

export const PROVIDER_PROFILES_TAG = "provider-profiles";
export const providerTag = (slug: string): string => `provider:${slug}`;

const REVALIDATE_SECONDS = 600;
const MAX_LIST_PAGES = 50;

/** En desarrollo no se cachea: así un cambio en el servidor de prueba se ve al recargar. */
function cacheOptions(tags: readonly string[]): RequestInit {
  if (process.env.NODE_ENV === "development") return { cache: "no-store" };
  return { next: { revalidate: REVALIDATE_SECONDS, tags: [...tags] } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Valida lo imprescindible y normaliza lo opcional. El `as` es el único del
 * archivo y vive en este borde: el contrato es nuestro, el backend lo
 * implementa otro equipo, y un campo que falte no puede tirar abajo la página
 * (los bloques sin dato se omiten).
 */
function parseProfile(raw: unknown): PartnerProfile | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.slug !== "string" || !isValidSlug(raw.slug)) return null;
  if (typeof raw.name !== "string" || raw.name.trim() === "") return null;

  const contact = isRecord(raw.contact) ? raw.contact : {};
  const emptySpecific = { mode: "specific", items: [] } as const;

  return {
    ...(raw as unknown as PartnerProfile),
    secondaryCategories: array(raw.secondaryCategories) as PartnerProfile["secondaryCategories"],
    services: array(raw.services) as PartnerProfile["services"],
    equipment: array(raw.equipment) as PartnerProfile["equipment"],
    links: array(raw.links) as PartnerProfile["links"],
    vehicleTypes: array(raw.vehicleTypes) as PartnerProfile["vehicleTypes"],
    brands: (isRecord(raw.brands) ? raw.brands : emptySpecific) as PartnerProfile["brands"],
    fuelTypes: (isRecord(raw.fuelTypes) ? raw.fuelTypes : emptySpecific) as PartnerProfile["fuelTypes"],
    contact: {
      whatsappUrl: typeof contact.whatsappUrl === "string" ? contact.whatsappUrl : null,
      phoneE164: typeof contact.phoneE164 === "string" ? contact.phoneE164 : null,
    },
    isAlly: raw.isAlly === true,
    indexable: raw.indexable === true,
  };
}

/** Lee un perfil por slug. Un slug con formato inválido es `not_found` SIN consultar. */
export async function getProviderProfile(slug: string): Promise<ProfileResult> {
  if (!isValidSlug(slug)) return { status: "not_found" };

  const response = await fetch(
    `${apiBaseUrl()}/api/v1/partner-profiles/${slug}`,
    cacheOptions([PROVIDER_PROFILES_TAG, providerTag(slug)]),
  );

  if (response.status === 404) return { status: "not_found" };
  if (!response.ok) {
    throw new Error(`[provider-profile] el backend respondió ${response.status} para "${slug}"`);
  }

  const body: unknown = await response.json();
  if (isRecord(body) && body.status === "moved") {
    if (typeof body.slug === "string" && isValidSlug(body.slug)) {
      return { status: "moved", slug: body.slug };
    }
    throw new Error(`[provider-profile] redirección inválida para "${slug}"`);
  }

  const profile = isRecord(body) && body.status === "ok" ? parseProfile(body.profile) : null;
  if (!profile) throw new Error(`[provider-profile] respuesta inválida para "${slug}"`);
  return { status: "ok", profile };
}

export type ListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly category?: string;
  readonly locality?: string;
};

/** Una página del listado. Tira ante un error: quien llama decide cómo degradar. */
export async function listProviderProfiles(query: ListQuery = {}): Promise<PartnerProfileList> {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(Math.min(query.pageSize ?? 50, 100)));
  if (query.category && isValidSlug(query.category)) params.set("category", query.category);
  if (query.locality && isValidSlug(query.locality)) params.set("locality", query.locality);

  const response = await fetch(
    `${apiBaseUrl()}/api/v1/partner-profiles?${params.toString()}`,
    cacheOptions([PROVIDER_PROFILES_TAG]),
  );
  if (!response.ok) {
    throw new Error(`[provider-profile] el listado respondió ${response.status}`);
  }

  const body: unknown = await response.json();
  if (!isRecord(body) || !Array.isArray(body.data)) {
    throw new Error("[provider-profile] listado con formato inválido");
  }

  // El `as` del borde: cada fila se filtra por lo imprescindible (slug y nombre).
  const data = (body.data as unknown[]).filter(
    (row): row is PartnerProfileSummary =>
      isRecord(row) &&
      typeof row.slug === "string" &&
      isValidSlug(row.slug) &&
      typeof row.name === "string",
  );

  return {
    data,
    total: typeof body.total === "number" ? body.total : data.length,
    page: typeof body.page === "number" ? body.page : 1,
    pageSize: typeof body.pageSize === "number" ? body.pageSize : data.length,
    totalPages: typeof body.totalPages === "number" ? body.totalPages : 1,
  };
}

/**
 * Todos los perfiles publicados, recorriendo páginas (tope de seguridad de
 * `MAX_LIST_PAGES`). Para `generateStaticParams` y el sitemap: si el backend
 * no responde, LOGUEA y devuelve `[]` — el build no puede fallar porque el
 * backend esté caído (mismo criterio que el blog).
 */
export async function listAllProviderSummaries(): Promise<readonly PartnerProfileSummary[]> {
  try {
    const all: PartnerProfileSummary[] = [];
    for (let page = 1; page <= MAX_LIST_PAGES; page += 1) {
      const result = await listProviderProfiles({ page, pageSize: 100 });
      all.push(...result.data);
      if (page >= result.totalPages) break;
    }
    return all;
  } catch (error) {
    console.error("[provider-profile] no se pudo leer el listado:", error);
    return [];
  }
}
