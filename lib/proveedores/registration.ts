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
 * Como se reconoce y como se arma el link de cada red.
 *
 * `domains`: un link pegado tiene que ser de uno de estos dominios (o de un
 * subdominio, como `m.facebook.com` o `vm.tiktok.com`). Sin esto, un
 * `https://taller.belgrano` —el usuario de Instagram con `https://` adelante—
 * pasaba como URL valida y se guardaba un link que no lleva a ningun lado.
 *
 * `handle` + `profileUrl`: la gente sabe su usuario, no el link de su perfil.
 * Si escribe `ramirosarasola` o `@ramirosarasola`, el link lo armamos
 * nosotros. Los patrones son los caracteres que cada red permite en un
 * usuario. LinkedIn no tiene: con solo el usuario no se sabe si es una
 * persona (`/in/`) o una empresa (`/company/`), y adivinar seria peor que
 * pedir el link.
 */
const SOCIAL_NETWORKS: Record<
  ProviderSocialKey,
  {
    readonly domains: readonly string[];
    readonly handle?: RegExp;
    readonly profileUrl?: (handle: string) => string;
  }
> = {
  instagram: {
    domains: ["instagram.com", "instagr.am"],
    handle: /^[A-Za-z0-9._]{1,30}$/,
    profileUrl: (handle) => `https://www.instagram.com/${handle}`,
  },
  facebook: {
    domains: ["facebook.com", "fb.com", "fb.me"],
    handle: /^[A-Za-z0-9.]{5,50}$/,
    profileUrl: (handle) => `https://www.facebook.com/${handle}`,
  },
  tiktok: {
    domains: ["tiktok.com"],
    handle: /^[A-Za-z0-9._]{2,24}$/,
    profileUrl: (handle) => `https://www.tiktok.com/@${handle}`,
  },
  linkedin: { domains: ["linkedin.com", "lnkd.in"] },
  youtube: {
    domains: ["youtube.com", "youtu.be"],
    handle: /^[A-Za-z0-9._-]{3,30}$/,
    profileUrl: (handle) => `https://www.youtube.com/@${handle}`,
  },
};

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

/**
 * Lo que el backend acepta. Lo valida con `@IsUrl({ protocols: ['http',
 * 'https'], require_protocol: true })`, bastante mas estricto que `new URL()`:
 * `new URL("https://mi_taller")` funciona y `@IsUrl` lo rechaza (guion bajo en
 * el host, sin terminacion). Se exige:
 *   - sin usuario ni contraseña.
 *   - un host con nombre de dominio, no una IP: etiquetas de letras, numeros y
 *     guiones (sin guion al principio ni al final, hasta 63 caracteres) y una
 *     terminacion de solo letras, o punycode (`xn--…`).
 *   - hasta 2048 caracteres DESPUES de normalizar: lo que viaja es `url.href`,
 *     y escapar caracteres lo puede alargar.
 */
function acceptedByBackend(url: URL): boolean {
  const labels = url.hostname.split(".");
  return (
    !url.username &&
    !url.password &&
    labels.length >= 2 &&
    labels.every((label) => DOMAIN_LABEL.test(label)) &&
    URL_TLD.test(labels[labels.length - 1]) &&
    url.href.length <= SOCIAL_LINK_MAX_LENGTH
  );
}

/**
 * Convierte lo que la persona escribio en el link del perfil, o `null` si no
 * se puede sin adivinar. En orden:
 *
 *   1. Un link con `http(s)://`: tiene que ser del dominio de esa red.
 *   2. Un link sin protocolo (`instagram.com/taller`): se le agrega `https://`,
 *      con la misma condicion del dominio.
 *   3. Un usuario, con o sin `@` (`ramirosarasola`, `@taller.belgrano`): se
 *      arma el link del perfil.
 *
 * Un link al dominio pelado (`instagram.com`) no es un perfil y no vale. El
 * `@` en el path (`youtube.com/@canal`) si.
 */
export function normalizeProviderSocialLink(
  network: ProviderSocialKey,
  value: string,
): string | null {
  const text = value.trim();
  const { domains, handle, profileUrl } = SOCIAL_NETWORKS[network];
  const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(text);
  const asUrl = parseHttpUrl(hasProtocol ? text : `https://${text}`);
  const onNetworkDomain =
    asUrl !== null &&
    domains.some(
      (domain) =>
        asUrl.hostname === domain || asUrl.hostname.endsWith(`.${domain}`),
    );

  let url: URL | null = null;
  if (onNetworkDomain) {
    // El dominio de la red sin perfil (`instagram.com`) no es un link util,
    // y tampoco se reinterpreta como usuario.
    if (asUrl.pathname !== "/" || asUrl.search !== "") url = asUrl;
  } else if (!hasProtocol && handle && profileUrl) {
    const name = text.replace(/^@/, "");
    if (handle.test(name)) url = parseHttpUrl(profileUrl(name));
  }

  return url && acceptedByBackend(url) ? url.href : null;
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
    const link = normalizeProviderSocialLink(network, value);
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
