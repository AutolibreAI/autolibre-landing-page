import {
  providerProfileContent as copy,
  fillTemplate,
} from "@/lib/content/provider-profile";
import type { OpenStatus } from "@/lib/provider-profile/open-status";
import { PROVIDER_INDEX_PATH, providerPath } from "@/lib/provider-profile/routes";
import { slugify } from "@/lib/provider-profile/slug";
import type {
  BusinessHoursDay,
  PartnerProfile,
  ProfileLink,
} from "@/lib/provider-profile/types";

/**
 * Helpers de presentación del perfil: convierten datos del contrato en lo que
 * muestran la página, los datos estructurados y la metadata. Server-safe (sin
 * `server-only`) para que los pueda usar también una isla de cliente.
 *
 * Una sola fuente por dato: la página y el JSON-LD leen de acá, así lo que se
 * declara es lo que se ve (FR-036).
 */

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** "2026-03" → "marzo 2026". Un valor que no tiene ese formato devuelve `null`. */
export function monthYearLabel(value: string | null | undefined): string | null {
  const match = /^(\d{4})-(\d{2})/.exec(value ?? "");
  if (!match) return null;
  const month = MONTH_NAMES[Number(match[2]) - 1];
  return month ? `${month} ${match[1]}` : null;
}

/** "08:00" → "8:00"; `"24:00"` se muestra como "00:00". */
export function shortTime(time: string): string {
  return (time === "24:00" ? "00:00" : time).replace(/^0(\d)/, "$1");
}

/** Texto de los tramos de un día: "8:00 a 12:00 y 14:00 a 18:00". */
export function rangesLabel(ranges: BusinessHoursDay["ranges"]): string {
  return [...ranges]
    .sort((a, b) => a.opensAt.localeCompare(b.opensAt))
    .map((range) => `${shortTime(range.opensAt)} a ${shortTime(range.closesAt)}`)
    .join(copy.hours.rangeJoiner);
}

export type HoursRow = {
  /** ISO: 1 = lunes … 7 = domingo. */
  readonly weekday: number;
  readonly day: string;
  /** "Cerrado" o los tramos. */
  readonly text: string;
  readonly closed: boolean;
};

/** Los siete días, de lunes a domingo, con "Cerrado" donde no hay tramos. */
export function hoursRows(hours: readonly BusinessHoursDay[]): readonly HoursRow[] {
  return copy.weekdays.map((day, index) => {
    const weekday = index + 1;
    const entry = hours.find((candidate) => candidate.weekday === weekday);
    const hasRanges = (entry?.ranges.length ?? 0) > 0;
    return {
      weekday,
      day,
      text: hasRanges && entry ? rangesLabel(entry.ranges) : copy.hours.closedDay,
      closed: !hasRanges,
    };
  });
}

/** Texto del estado en vivo; `null` si no hay horarios (no se muestra nada). */
export function openStatusLabel(status: OpenStatus): string | null {
  if (status.kind === "unknown") return null;
  if (status.kind === "open") {
    return fillTemplate(copy.status.open, { time: shortTime(status.closesAt) });
  }
  const { dayOffset, weekday, opensAt } = status.nextOpening;
  const time = shortTime(opensAt);
  if (dayOffset === 0) return fillTemplate(copy.status.closedToday, { time });
  if (dayOffset === 1) return fillTemplate(copy.status.closedTomorrow, { time });
  return fillTemplate(copy.status.closedOn, {
    day: copy.weekdaysLower[weekday - 1] ?? "",
    time,
  });
}

/** "4,8" (una decimal y coma). */
export function ratingText(average: number): string {
  return average.toFixed(1).replace(".", ",");
}


function categoryLabel(profile: PartnerProfile): string | null {
  return profile.primaryCategory?.name ?? null;
}

/** Título de la página (sin la marca: la agrega el template del layout). */
export function profileTitle(profile: PartnerProfile): string {
  const category = categoryLabel(profile);
  const locality = profile.locality?.trim() || null;
  const values = { name: profile.name, category: category ?? "", locality: locality ?? "" };
  if (category && locality) return fillTemplate(copy.meta.title, values);
  if (category) return fillTemplate(copy.meta.titleNoLocality, values);
  if (locality) return fillTemplate(copy.meta.titleNoCategory, values);
  return fillTemplate(copy.meta.titleNameOnly, values);
}

const DESCRIPTION_LIMIT = 155;

/** Recorta en un límite de palabra, sin saltos de línea ni marcado. */
export function trimDescription(text: string, limit: number = DESCRIPTION_LIMIT): string {
  const flat = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:\s]+$/, "")}…`;
}

/** Meta descripción: la del proveedor recortada, o la plantilla (única: lleva el nombre). */
export function profileDescription(profile: PartnerProfile): string {
  const own = (profile.description ?? "").trim();
  if (own) return trimDescription(own);
  const category = categoryLabel(profile);
  const locality = profile.locality?.trim() || null;
  const values = { name: profile.name, category: category ?? "", locality: locality ?? "" };
  if (category && locality) return fillTemplate(copy.meta.descriptionFallback, values);
  if (category) return fillTemplate(copy.meta.descriptionFallbackNoLocality, values);
  if (locality) return fillTemplate(copy.meta.descriptionFallbackNoCategory, values);
  return fillTemplate(copy.meta.descriptionFallbackNameOnly, values);
}

/** "Rubro · Localidad" para la imagen de vista previa y los textos cortos. */
export function categoryAndLocality(profile: PartnerProfile): string {
  return [categoryLabel(profile), profile.locality?.trim()].filter(Boolean).join(" · ");
}

/** Solo `http(s)`: un `javascript:` no se renderiza como link (research D27). */
export function safeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** El botón de WhatsApp solo abre `wa.me` (nunca una URL arbitraria del backend). */
export function safeWhatsappUrl(url: string | null | undefined): string | null {
  const safe = safeExternalUrl(url);
  if (!safe) return null;
  const host = new URL(safe).hostname;
  return host === "wa.me" || host === "api.whatsapp.com" ? safe : null;
}

/** Búsqueda de Google Maps por coordenadas si existen, o por la dirección. */
export function directionsUrl(profile: PartnerProfile): string | null {
  const address = profile.address;
  if (!address) return null;
  const destination =
    address.latitude !== null && address.longitude !== null
      ? `${address.latitude},${address.longitude}`
      : address.full;
  if (!destination.trim()) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

/** Mapa estático de Google solo si hay coordenadas Y la API key pública. */
export function staticMapUrl(profile: PartnerProfile): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const address = profile.address;
  if (!key || !address || address.latitude === null || address.longitude === null) return null;
  const center = `${address.latitude},${address.longitude}`;
  return (
    "https://maps.googleapis.com/maps/api/staticmap" +
    `?center=${center}&zoom=16&size=640x320&scale=2&maptype=roadmap` +
    `&markers=color:green%7C${center}&key=${encodeURIComponent(key)}`
  );
}

export const STATIC_MAP_SIZE = { width: 640, height: 320 } as const;

/** Etiqueta de un link del proveedor (Instagram, sitio web…). */
export function linkLabel(link: ProfileLink): string {
  switch (link.kind) {
    case "instagram":
      return copy.contact.instagram;
    case "website":
      return copy.contact.website;
    case "facebook":
      return copy.contact.facebook;
    case "x":
      return copy.contact.x;
    case "tiktok":
      return copy.contact.tiktok;
    case "mercado_libre":
      return copy.contact.mercadoLibre;
    default:
      return copy.contact.other;
  }
}

/** Años en el rubro, o `null` si falta el dato o no es creíble. */
export function yearsInTrade(foundedYear: number | null, now: Date = new Date()): number | null {
  if (foundedYear === null) return null;
  const years = now.getFullYear() - foundedYear;
  return years >= 1 && years <= 100 ? years : null;
}

/** Zona de cobertura en una frase: las localidades unidas con coma. */
export function serviceAreaNames(profile: PartnerProfile): readonly string[] {
  return (profile.serviceArea?.localities ?? []).map((locality) => locality.name);
}

/** Cuántas reseñas y trabajos se ven en la web; el JSON-LD declara solo esas. */
export const VISIBLE_REVIEWS = 3;
export const VISIBLE_WORKS = 3;

/** Convierte una ruta relativa en URL absoluta (para datos estructurados). */
export function absoluteUrl(url: string, base: string): string {
  return url.startsWith("/") ? `${base}${url}` : url;
}

const OPTIMIZABLE_HOST_SUFFIXES = [
  ".graphassets.com",
  "hebbkx1anhila5yf.public.blob.vercel-storage.com",
] as const;

/**
 * `true` si la imagen viene de un host que `next/image` NO tiene declarado en
 * `remotePatterns` (p. ej. un logo legacy de la planilla): se renderiza con
 * `unoptimized` y `width`/`height` fijos en vez de romper la página
 * (research D10). Una ruta relativa siempre se puede optimizar.
 */
export function isUnoptimizedImage(url: string): boolean {
  if (url.startsWith("/")) return false;
  try {
    const host = new URL(url).hostname;
    const own = process.env.PROVIDER_IMAGE_HOST?.trim();
    if (own && host === own) return false;
    return !OPTIMIZABLE_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(suffix));
  } catch {
    return true;
  }
}

export type Crumb = { readonly name: string; readonly path: string };

/**
 * Ruta "Proveedores › Localidad › Rubro › Nombre". UNA lista alimenta las
 * migas visibles y el `BreadcrumbList`: idénticas (FR-034). Un nivel sin dato
 * (sin localidad, sin rubro) se omite en los dos lados. La spec no incluye
 * "Inicio" como primer paso.
 */
export function profileTrail(profile: PartnerProfile): readonly Crumb[] {
  const trail: Crumb[] = [{ name: copy.breadcrumb.providers, path: PROVIDER_INDEX_PATH }];
  const locality = profile.locality?.trim();
  if (locality) trail.push({ name: locality, path: `${PROVIDER_INDEX_PATH}?zona=${slugify(locality)}` });
  if (profile.primaryCategory) {
    trail.push({
      name: profile.primaryCategory.name,
      path: `${PROVIDER_INDEX_PATH}?rubro=${profile.primaryCategory.slug}`,
    });
  }
  trail.push({ name: profile.name, path: providerPath(profile.slug) });
  return trail;
}
