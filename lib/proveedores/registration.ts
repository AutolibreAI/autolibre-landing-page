export const PROVIDER_LOGO_MAX_BYTES = 512 * 1024;
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
