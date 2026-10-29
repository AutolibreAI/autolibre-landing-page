export const PROVIDER_LOGO_MAX_BYTES = 512 * 1024;
export const PROVIDER_DESCRIPTION_MAX_LENGTH = 90;
export const PROVIDER_BRAND_MAX_LENGTH = 100;
export const PROVIDER_BRAND_MAX_COUNT = 50;

/**
 * Contrato con `POST /partner-applications` del backend, escrito a mano y a
 * proposito MAS estricto que el. La regla es una sola: todo lo que esta landing
 * deja pasar tiene que ser valido alla. Si alguna vez nuestra regla rechaza
 * algo que el backend aceptaria, es un tradeoff aceptado; al reves, es un bug,
 * porque el 400 del backend llega a la persona como un cartel generico que no
 * dice que campo corregir.
 *
 * De donde sale cada numero (autolibre-backend-hex):
 *   - taller → `MAX_BUSINESS_NAME_LENGTH` (business-name.vo.ts)
 *   - direccion → `MAX_ADDRESS_LENGTH` (partner-application.entity.ts)
 *   - hours, service_other, how_found, how_found_other →
 *     `MAX_FREE_TEXT_LENGTH` (partner-application.entity.ts)
 *
 * Si cambian alla, cambian acá.
 */
export const PROVIDER_TEXT_MAX_LENGTH = {
  taller: 120,
  direccion: 250,
  hours: 500,
  service_other: 500,
  how_found: 500,
  how_found_other: 500,
} as const;
export type ProviderTextField = keyof typeof PROVIDER_TEXT_MAX_LENGTH;

/**
 * El primer campo de texto que supera su maximo, o `null`. Se mide recortado,
 * igual que el backend. `.length` cuenta unidades UTF-16 y el `@MaxLength` del
 * backend cuenta code points: con un emoji, nuestro numero da mas, asi que el
 * error cae siempre del lado seguro.
 */
export function findTooLongProviderText(
  fields: Partial<Record<ProviderTextField, string | null | undefined>>,
): ProviderTextField | null {
  for (const key of Object.keys(PROVIDER_TEXT_MAX_LENGTH) as ProviderTextField[]) {
    const value = fields[key];
    if (typeof value === "string" && value.trim().length > PROVIDER_TEXT_MAX_LENGTH[key])
      return key;
  }
  return null;
}

export const PROVIDER_EMAIL_MAX_LENGTH = 254;
const EMAIL_LOCAL_PART = /^[A-Za-z0-9_%+-]+(?:\.[A-Za-z0-9_%+-]+)*$/;
const DOMAIN_LABEL = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;
const EMAIL_TLD = /^[A-Za-z]{2,63}$/;

/**
 * El email tiene que pasar DOS validaciones del backend: `@IsEmail()` en el
 * DTO (validator.js) y el VO `Email` del dominio. Esto es un subconjunto de
 * las dos:
 *
 *   - antes de la `@`: letras y numeros ASCII, `.`, `_`, `%`, `+` y `-`. Sin
 *     punto al principio, al final ni dos seguidos. Hasta 64 caracteres.
 *   - despues de la `@`: un dominio con al menos un punto (`gmail.com`, no
 *     `gmail`), etiquetas de hasta 63 caracteres que no empiezan ni terminan
 *     con guion, y una terminacion de solo letras (`.com`, `.ar`).
 *   - hasta 254 caracteres en total.
 *
 * Quedan afuera direcciones validas pero rarisimas (con tildes, entre
 * comillas o con IP en vez de dominio). Es el precio de no rebotar nunca.
 */
export function isValidProviderEmail(value: string): boolean {
  const email = value.trim();
  if (email.length > PROVIDER_EMAIL_MAX_LENGTH) return false;

  const at = email.lastIndexOf("@");
  if (at <= 0) return false;
  const local = email.slice(0, at);
  const labels = email.slice(at + 1).split(".");
  const tld = labels[labels.length - 1];

  return (
    local.length <= 64 &&
    EMAIL_LOCAL_PART.test(local) &&
    labels.length >= 2 &&
    labels.every((label) => DOMAIN_LABEL.test(label)) &&
    EMAIL_TLD.test(tld)
  );
}

const SOCIAL_LINK_MAX_LENGTH = 2048;
const URL_TLD = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

/**
 * Normaliza un link de red social, o `null` si el backend lo rechazaria. El
 * backend lo valida con `@IsUrl({ protocols: ['http', 'https'],
 * require_protocol: true })`, que es bastante mas estricto que `new URL()`:
 * `new URL("https://mi_taller")` funciona y `@IsUrl` lo rechaza (guion bajo en
 * el host, sin terminacion).
 *
 * Lo que se exige:
 *   - `http://` o `https://`, sin usuario ni contraseña.
 *   - un host con nombre de dominio, no una IP: etiquetas de letras, numeros y
 *     guiones (sin guion al principio ni al final, hasta 63 caracteres) y una
 *     terminacion de solo letras. `new URL` ya paso los acentos a punycode
 *     (`xn--…`), que tambien vale.
 *   - hasta 2048 caracteres DESPUES de normalizar: lo que viaja es `url.href`,
 *     y escapar caracteres lo puede alargar.
 *
 * El `@` en el path (`youtube.com/@canal`) es valido y se respeta.
 */
export function normalizeProviderSocialLink(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  const labels = url.hostname.split(".");
  const tld = labels[labels.length - 1];
  const validHost =
    labels.length >= 2 &&
    labels.every((label) => DOMAIN_LABEL.test(label)) &&
    URL_TLD.test(tld);

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    !validHost ||
    url.href.length > SOCIAL_LINK_MAX_LENGTH
  )
    return null;

  return url.href;
}

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
    if (!value.trim()) continue;
    const link = normalizeProviderSocialLink(value);
    if (!link) return { ok: false, kind: "socialLinks", network };
    socialLinks[network] = link;
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
