export const PROVIDER_LOGO_MAX_BYTES = 512 * 1024;
export const PROVIDER_DESCRIPTION_MAX_LENGTH = 90;
export const PROVIDER_BRAND_MAX_LENGTH = 100;
export const PROVIDER_BRAND_MAX_COUNT = 50;

export function appendProviderBrand(brands: readonly string[], value: string, maxCount = PROVIDER_BRAND_MAX_COUNT): string[] {
  const brand = value.trim().replace(/\s+/g, " ");
  const key = (text: string) => text.toLocaleLowerCase("es-AR");
  if (!brand || brand.length > PROVIDER_BRAND_MAX_LENGTH || brands.length >= maxCount || brands.some((item) => key(item) === key(brand))) return [...brands];
  return [...brands, brand];
}
export const PROVIDER_SOCIAL_KEYS = [
  "instagram",
  "facebook",
  "tiktok",
  "linkedin",
  "youtube",
] as const;
export type ProviderSocialKey = (typeof PROVIDER_SOCIAL_KEYS)[number];
export type ProviderSocialLinks = Partial<Record<ProviderSocialKey, string>>;

type ProfileFieldsResult =
  | { ok: true; description?: string; socialLinks?: ProviderSocialLinks }
  | {
      ok: false;
      kind: "description" | "socialLinks";
      network?: ProviderSocialKey;
    };

export function parseProviderProfileFields(
  description: unknown,
  links: unknown,
): ProfileFieldsResult {
  if (description !== undefined && typeof description !== "string")
    return { ok: false, kind: "description" };
  const text = typeof description === "string" ? description.trim() : "";
  if (text.length > PROVIDER_DESCRIPTION_MAX_LENGTH)
    return { ok: false, kind: "description" };
  if (
    links !== undefined &&
    (!links || typeof links !== "object" || Array.isArray(links))
  )
    return { ok: false, kind: "socialLinks" };
  const socialLinks: ProviderSocialLinks = {};
  for (const [key, value] of Object.entries(links ?? {})) {
    if (!(PROVIDER_SOCIAL_KEYS as readonly string[]).includes(key))
      return { ok: false, kind: "socialLinks" };
    const network = key as ProviderSocialKey;
    if (typeof value !== "string")
      return { ok: false, kind: "socialLinks", network };
    const trimmed = value.trim();
    if (!trimmed) continue;
    try {
      const url = new URL(trimmed);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        !url.hostname.includes(".") ||
        url.username ||
        url.password ||
        trimmed.length > 2048
      )
        throw new Error();
      socialLinks[network] = url.href;
    } catch {
      return { ok: false, kind: "socialLinks", network };
    }
  }
  return {
    ok: true,
    ...(text ? { description: text } : {}),
    ...(Object.keys(socialLinks).length ? { socialLinks } : {}),
  };
}
export const PROVIDER_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export function validProviderLogo(file: {
  size: number;
  type: string;
}): boolean {
  return (
    file.size > 0 &&
    file.size <= PROVIDER_LOGO_MAX_BYTES &&
    (PROVIDER_LOGO_TYPES as readonly string[]).includes(file.type)
  );
}

export function validBrandSelection(
  worksAllBrands: boolean,
  brands: readonly string[],
  specialties: readonly string[],
): boolean {
  return (
    worksAllBrands ||
    (brands.length > 0 && specialties.every((brand) => brands.includes(brand)))
  );
}
