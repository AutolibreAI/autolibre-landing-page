/**
 * El perfil del negocio en "Mi negocio", leído de `GET /api/v1/partners/{id}`
 * (público, sin token): es EXACTAMENTE lo que lee la app para la ficha del
 * taller (`HexPartnerApi.adapter.ts`, `getWorkshopProfile`), así la vista
 * previa "Así te ven en la app" usa el mismo dato que la app.
 *
 * El backend no tiene una lectura del perfil para el dueño: este endpoint
 * responde 404 si el negocio está pausado o archivado. Para la pantalla eso
 * es "no visible en la red", no "no existe".
 *
 * Módulo puro (sin alias `@/` ni imports de la app): lo prueban los tests de
 * `scripts/partner-billing/` con `node --test`.
 */

export type PartnerServiceGroup = {
  readonly slug: string;
  readonly name: string;
  readonly services: readonly string[];
};

export type PartnerLinkView = { readonly kind: string; readonly url: string };

export type OwnerPartnerProfile = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly logoUrl: string | null;
  readonly whatsapp: string | null;
  readonly address: string | null;
  /** Horarios en texto libre (no es una grilla: la app todavía no los muestra). */
  readonly hours: string | null;
  readonly modality: string | null;
  readonly coverageZone: string;
  /** Link de WhatsApp curado o armado por el backend: con alguno, la app muestra el botón de chat. */
  readonly contactUrl: string | null;
  readonly hasGeo: boolean;
  /** Familias de rubros, en el orden del catálogo (ya con nombre). */
  readonly categories: readonly string[];
  readonly serviceGroups: readonly PartnerServiceGroup[];
  /** `[]` = todas las marcas. */
  readonly brands: readonly string[];
  readonly links: readonly PartnerLinkView[];
  /** Foto PROPIA del taller (las de stock, `isPlaceholder`, la app no las muestra). */
  readonly coverUrl: string | null;
  readonly rating: { readonly average: number; readonly count: number } | null;
  readonly reviewsCount: number;
};

export type PartnerProfileResult =
  | { readonly kind: "ok"; readonly profile: OwnerPartnerProfile }
  /** 404: pausado o archivado (el endpoint es el del directorio público). */
  | { readonly kind: "not-visible" }
  | { readonly kind: "unknown" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.flatMap((item) => (text(item) ? [text(item) as string] : [])) : [];
}

function parseGroups(value: unknown): PartnerServiceGroup[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((group): PartnerServiceGroup[] => {
    if (!isRecord(group) || !isRecord(group.category)) return [];
    const slug = text(group.category.slug);
    const name = text(group.category.name);
    const services = Array.isArray(group.items)
      ? group.items.flatMap((item) => (isRecord(item) && text(item.name) ? [text(item.name) as string] : []))
      : [];
    return slug && name && services.length > 0 ? [{ slug, name, services }] : [];
  });
}

function parseRating(value: unknown): OwnerPartnerProfile["rating"] {
  if (!isRecord(value)) return null;
  const { average, count } = value;
  return typeof average === "number" && typeof count === "number" && Number.isFinite(average) && count > 0
    ? { average, count }
    : null;
}

/** Body de `GET /partners/{id}` ⇒ perfil, o `null` si no tiene forma. */
export function parsePartnerDetail(body: unknown): OwnerPartnerProfile | null {
  if (!isRecord(body)) return null;
  const id = text(body.id);
  const name = text(body.name);
  if (!id || !name) return null;

  const cover = isRecord(body.cover) && body.cover.isPlaceholder !== true ? text(body.cover.url) : null;
  const links = Array.isArray(body.links)
    ? body.links.flatMap((link): PartnerLinkView[] =>
        isRecord(link) && text(link.kind) && text(link.url)
          ? [{ kind: text(link.kind) as string, url: text(link.url) as string }]
          : [],
      )
    : [];

  return {
    id,
    name,
    description: text(body.description),
    logoUrl: text(body.logoUrl),
    whatsapp: text(body.whatsapp),
    address: text(body.address),
    hours: text(body.hours),
    modality: text(body.modality),
    coverageZone: text(body.coverageZone) ?? "",
    contactUrl: text(body.redirectLink) ?? text(body.whatsappContactUrl),
    hasGeo: isRecord(body.geo) && typeof body.geo.latitude === "number" && typeof body.geo.longitude === "number",
    categories: strings(body.categories),
    serviceGroups: parseGroups(body.serviceGroups),
    brands: strings(body.brands),
    links,
    coverUrl: cover,
    rating: parseRating(body.rating),
    reviewsCount: Array.isArray(body.reviews) ? body.reviews.length : 0,
  };
}

/** Respuesta HTTP ⇒ resultado. */
export function parsePartnerDetailResponse(status: number, body: unknown): PartnerProfileResult {
  if (status === 404) return { kind: "not-visible" };
  if (status !== 200) return { kind: "unknown" };
  const profile = parsePartnerDetail(body);
  return profile ? { kind: "ok", profile } : { kind: "unknown" };
}

// ── "Completá tu perfil" ─────────────────────────────────────────────────────

/** Los datos del perfil que se pueden saber cargados o no con lo que devuelve el backend. */
export const PROFILE_CHECKLIST_KEYS = [
  "name",
  "logo",
  "description",
  "services",
  "address",
  "hours",
  "whatsapp",
  "links",
] as const;
export type ProfileChecklistKey = (typeof PROFILE_CHECKLIST_KEYS)[number];

export type ProfileChecklist = {
  readonly done: number;
  readonly total: number;
  /** Lo que falta, en el orden de la lista (el Resumen muestra estos). */
  readonly missing: readonly ProfileChecklistKey[];
};

export function isProfileFieldFilled(profile: OwnerPartnerProfile, key: ProfileChecklistKey): boolean {
  switch (key) {
    case "name":
      return profile.name !== "";
    case "logo":
      return profile.logoUrl !== null;
    case "description":
      return profile.description !== null;
    case "services":
      return profile.serviceGroups.length > 0 || profile.categories.length > 0;
    case "address":
      return profile.address !== null;
    case "hours":
      return profile.hours !== null;
    case "whatsapp":
      return profile.whatsapp !== null || profile.contactUrl !== null;
    case "links":
      return profile.links.length > 0;
  }
}

export function profileChecklist(profile: OwnerPartnerProfile): ProfileChecklist {
  const missing = PROFILE_CHECKLIST_KEYS.filter((key) => !isProfileFieldFilled(profile, key));
  return { done: PROFILE_CHECKLIST_KEYS.length - missing.length, total: PROFILE_CHECKLIST_KEYS.length, missing };
}

// ── Lo que muestra la app (réplica de `TallerPerfilScreen`) ──────────────────

/**
 * Iniciales: dos letras como mucho, de las dos primeras palabras que empiezan
 * con letra o número (`providerInitials` de la app: "H&G Cars" ⇒ "HC").
 */
export function partnerInitials(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((word) => /^[\p{L}\p{N}]/u.test(word))
    .slice(0, 2);
  if (words.length === 0) return "?";
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

/** Tonos de la portada con monograma de la app ("A · Monograma", 2026-11-17). */
export const MONOGRAM_TONES = ["dark", "soft", "gray"] as const;
export type MonogramTone = (typeof MONOGRAM_TONES)[number];

/** El tono por `id` (FNV-1a de 32 bits), igual que `monogramToneFor` de la app. */
export function monogramToneFor(id: string): MonogramTone {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return MONOGRAM_TONES[(hash >>> 0) % MONOGRAM_TONES.length] as MonogramTone;
}

/**
 * Subtítulo de la ficha SIN la distancia (la vista previa no sabe dónde está
 * quien mira): la familia principal, la modalidad o "Taller"
 * (`providerHeadlineLabel` de la app).
 */
export function appHeadline(profile: Pick<OwnerPartnerProfile, "categories" | "modality">): string {
  return profile.categories[0] ?? profile.modality ?? "Taller";
}

/** La línea de "Dónde está": la dirección o la zona (`tallerLocationLine`). */
export function appLocationLine(profile: Pick<OwnerPartnerProfile, "address" | "coverageZone">): string {
  return profile.address ?? profile.coverageZone;
}
