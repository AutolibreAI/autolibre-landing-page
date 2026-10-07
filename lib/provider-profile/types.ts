/**
 * Tipos del perfil público de proveedor: espejo del contrato
 * `specs/209-public-provider-profile/contracts/partner-profile-api.md`.
 * Todo `readonly` y sin `any`. Los campos que el contrato marca `| null` son
 * opcionales de verdad: la página omite el bloque, nunca inventa el dato.
 */

/** Imagen con dimensiones (siempre: `next/image` las necesita, Constitución IV). */
export type ProfileImage = {
  readonly url: string;
  readonly width: number;
  readonly height: number;
};

export type ProfileCategory = {
  readonly slug: string;
  readonly name: string;
};

export type ProfileTimeRange = {
  /** "HH:MM", 24 h. */
  readonly opensAt: string;
  /** "HH:MM"; `"24:00"` es válido y equivale a 1440 minutos. */
  readonly closesAt: string;
};

/** Un día de atención. Un día sin entrada = cerrado ese día. */
export type BusinessHoursDay = {
  /** ISO: 1 = lunes … 7 = domingo. */
  readonly weekday: number;
  readonly ranges: readonly ProfileTimeRange[];
};

export type LocationMode = "in_person" | "mobile" | "both";

export type ProfileAddress = {
  readonly full: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
};

export type ServiceAreaLocality = {
  readonly name: string;
  readonly partido?: string | null;
};

export type ProfileLink = {
  readonly kind:
    | "instagram"
    | "website"
    | "facebook"
    | "x"
    | "tiktok"
    | "mercado_libre"
    | "other";
  readonly url: string;
};

export type ProfileService = {
  readonly category: ProfileCategory;
  readonly items: readonly ProfileCategory[];
};

/** "Todas" o una lista explícita. Ningún cliente interpreta listas vacías. */
export type AllOrSpecific<T> =
  | { readonly mode: "all" }
  | { readonly mode: "specific"; readonly items: readonly T[] };

export type VehicleType = "car" | "suv" | "pickup" | "motorcycle";
export type FuelType = "gasoline" | "diesel" | "cng" | "hybrid" | "electric";

export type ProfileWorkPhoto = {
  readonly role: "before" | "after" | "other";
  readonly image: ProfileImage;
};

export type ProfileWork = {
  readonly id: string;
  readonly origin: "autolibre" | "own";
  readonly service: string;
  readonly vehicle: {
    readonly brand: string;
    readonly model: string;
    readonly year: number;
  };
  /** "YYYY-MM". */
  readonly monthYear: string;
  readonly photos: readonly ProfileWorkPhoto[];
};

export type ProfileWorks = {
  readonly registeredCount: number;
  readonly totalCount: number;
  readonly items: readonly ProfileWork[];
};

export type ProfileReview = {
  readonly id: string;
  /** Ya abreviado por el backend ("Lucía M."). */
  readonly displayName: string;
  readonly vehicle: string;
  /** "YYYY-MM". */
  readonly date: string;
  readonly stars: number;
  readonly text: string;
  readonly reply: { readonly text: string; readonly date: string } | null;
};

export type ProfileReviews = {
  readonly count: number;
  /** Un decimal. */
  readonly average: number;
  readonly items: readonly ProfileReview[];
};

export type ProfileMetrics = {
  readonly responseTimeMinutes: number | null;
  /** 0–1. */
  readonly responseRate: number | null;
  readonly proposalsSent: number | null;
};

export type PartnerProfile = {
  readonly slug: string;
  readonly name: string;
  readonly isAlly: boolean;
  /** "YYYY-MM" o null si el dato no es confiable. */
  readonly memberSince: string | null;
  readonly description: string | null;
  readonly logo: ProfileImage | null;
  readonly cover: ProfileImage | null;
  readonly primaryCategory: ProfileCategory | null;
  readonly secondaryCategories: readonly ProfileCategory[];
  readonly locality: string | null;
  readonly province: string | null;
  readonly locationMode: LocationMode;
  readonly address: ProfileAddress | null;
  readonly serviceArea: { readonly localities: readonly ServiceAreaLocality[] } | null;
  readonly businessHours: readonly BusinessHoursDay[] | null;
  readonly contact: {
    readonly whatsappUrl: string | null;
    readonly phoneE164: string | null;
  };
  readonly links: readonly ProfileLink[];
  readonly people: {
    readonly name: string;
    readonly role: string | null;
    readonly photo: ProfileImage | null;
  } | null;
  readonly foundedYear: number | null;
  readonly services: readonly ProfileService[];
  readonly brands: AllOrSpecific<string>;
  readonly vehicleTypes: readonly VehicleType[];
  readonly fuelTypes: AllOrSpecific<FuelType>;
  readonly equipment: readonly ProfileCategory[];
  /** Fase C: `null` hasta que el backend modele estos dominios. */
  readonly works: ProfileWorks | null;
  readonly reviews: ProfileReviews | null;
  readonly metrics: ProfileMetrics | null;
  readonly indexable: boolean;
  readonly updatedAt: string;
};

/** Fila del listado `GET /partner-profiles`. */
export type PartnerProfileSummary = {
  readonly slug: string;
  readonly name: string;
  readonly isAlly: boolean;
  readonly logo: ProfileImage | null;
  readonly primaryCategory: ProfileCategory | null;
  readonly locality: string | null;
  readonly rating: { readonly average: number; readonly count: number } | null;
  readonly indexable: boolean;
  readonly updatedAt: string;
};

export type PartnerProfileList = {
  readonly data: readonly PartnerProfileSummary[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
};

/** Resultado de leer un perfil por slug. */
export type ProfileResult =
  | { readonly status: "ok"; readonly profile: PartnerProfile }
  | { readonly status: "moved"; readonly slug: string }
  | { readonly status: "not_found" };
