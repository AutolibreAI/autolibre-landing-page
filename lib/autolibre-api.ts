/**
 * Cliente del backend de AutoLibre para las rutas de servidor de la landing.
 *
 * ── Por que la landing no le pega directo desde el browser ──────────────────
 *
 * Porque el form vive en una pagina publica y el endpoint es anonimo: si el
 * fetch saliera del cliente, la URL del backend quedaria en el bundle y
 * cualquiera podria postear sin pasar por acá. Manteniendo la llamada del lado
 * del servidor, `/api/provider` sigue siendo la unica superficie que ve el
 * navegador y el dia que haga falta sumar rate limiting o un captcha, hay
 * donde ponerlo.
 *
 * La lectura del catalogo de servicios se queda de este lado por un motivo
 * distinto y mas simple: se resuelve al renderizar la pagina, asi que el
 * formulario llega al browser con las opciones ya adentro del HTML. Sin
 * spinner, sin salto de layout y sin un fetch que el usuario tenga que esperar
 * para poder marcar un rubro.
 */

/**
 * Base del backend. Server-side a proposito (sin `NEXT_PUBLIC_`): esta URL no
 * tiene por que viajar al bundle del cliente.
 */
export function apiBaseUrl(): string {
  const trimmed = process.env.AUTOLIBRE_API_URL?.trim().replace(/\/+$/, "");

  if (!trimmed) {
    throw new Error(
      "Falta AUTOLIBRE_API_URL: la landing no sabe a que backend mandar las solicitudes de partner.",
    );
  }

  // Si alguien carga la variable con el sufijo puesto (typico al copiar la
  // URL de Swagger), los fetch de abajo terminarian pidiendo
  // `/api/v1/api/v1/...` y el backend responderia 404.
  return trimmed.replace(/\/api\/v1$/i, "");
}

export interface ServiceCatalogService {
  readonly slug: string;
  readonly name: string;
}

export interface ServiceCatalogCategory {
  readonly slug: string;
  readonly name: string;
  readonly services: readonly ServiceCatalogService[];
}

/**
 * Lo que el formulario necesita de una familia: su nombre, y sus rubros.
 *
 * Antes esto era un `Pick<..., "slug" | "name">` para que los 79 rubros NO
 * viajaran al browser, porque el formulario solo dejaba marcar familias. Hoy
 * deja marcar rubros, asi que el catalogo entero cruza al cliente a proposito.
 *
 * Lo que eso cuesta esta medido y es poco: 16 familias con ~79 rubros de
 * `{slug, name}` son unos pocos KB en el payload RSC, y viajan una sola vez
 * dentro del HTML de una pagina estatica. Lo que compra es que el taller quede
 * clasificado fino desde el alta, sin que nadie tenga que traducir a mano al
 * aprobar — que es el paso que en el legacy nunca se ejecutaba y dejaba
 * talleres aprobados pero invisibles en la app.
 *
 * El alias se queda (en vez de usar `ServiceCatalogCategory` pelado) porque
 * nombra el ROL: esto es "una familia como la ve el formulario". Si algun dia
 * la pantalla necesita menos de lo que trae el catalogo, se recorta acá y no
 * en cada componente.
 */
export type ServiceFamilyOption = ServiceCatalogCategory;

/**
 * Cada cuanto se revalida el catalogo de servicios.
 *
 * Cinco minutos es un numero elegido por lo que cuesta EQUIVOCARSE, no por lo
 * que cuesta acertar: el catalogo cambia una vez cada varios meses, asi que
 * cualquier ventana lo sirve igual de fresco. Lo que la ventana acota de verdad
 * es cuanto tiempo queda pegado un render que salio mal — si el backend estaba
 * caido justo cuando Next armo la pagina, el formulario degradado vive cinco
 * minutos y no una hora. Refetchear cada cinco minutos una lista de 79 filas no
 * le cuesta nada a nadie; servir el formulario roto media tarde, si.
 */
const SERVICE_CATALOG_REVALIDATE_SECONDS = 300;

/**
 * Catalogo de servicios (familias y rubros) que el backend expone publico.
 *
 * Devuelve `null` —nunca tira— cuando el backend no contesta: quien renderiza
 * decide que hacer con eso. El formulario de partners lo traduce en un aviso
 * visible mas un campo de texto libre, porque perder un taller que se estaba
 * anotando es peor que recibirlo con los rubros sin normalizar.
 *
 * El orden en que viene es el `position` que definio el equipo. NO se reordena
 * acá ni en la UI: alfabetizarlo pondria "Aire acondicionado" antes que "Motor"
 * y el primer rubro que ve alguien dejaria de ser el que mas talleres marcan.
 */
export async function fetchServiceCatalog(): Promise<
  ServiceCatalogCategory[] | null
> {
  try {
    const response = await fetch(`${apiBaseUrl()}/api/v1/service-catalog`, {
      next: { revalidate: SERVICE_CATALOG_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.error(
        `[service-catalog] el backend respondio ${response.status}; la landing sirve el formulario degradado.`,
      );
      return null;
    }

    const payload = (await response.json()) as { categories?: unknown };
    return parseCategories(payload.categories);
  } catch (error) {
    // Incluye el caso de `AUTOLIBRE_API_URL` sin setear: que falte una variable
    // de entorno no puede tirar abajo el build de una pagina de marketing, pero
    // tampoco puede pasar inadvertido — de ahi el log.
    console.error("[service-catalog] no se pudo leer el catalogo:", error);
    return null;
  }
}

/**
 * Parseo defensivo. El endpoint es nuestro, pero un rubro sin `name` renderiza
 * una pildora vacia que nadie va a poder marcar: mejor descartarlo que
 * mostrarlo. Una familia sin rubros tampoco entra — seria un acordeon vacio.
 */
function parseCategories(value: unknown): ServiceCatalogCategory[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((category): ServiceCatalogCategory | null => {
      if (typeof category !== "object" || category === null) return null;

      const { slug, name, services } = category as Record<string, unknown>;
      if (typeof slug !== "string" || typeof name !== "string") return null;

      const parsedServices = (Array.isArray(services) ? services : [])
        .map((service): ServiceCatalogService | null => {
          if (typeof service !== "object" || service === null) return null;

          const entry = service as Record<string, unknown>;
          return typeof entry.slug === "string" && typeof entry.name === "string"
            ? { slug: entry.slug, name: entry.name }
            : null;
        })
        .filter((service): service is ServiceCatalogService => service !== null);

      return parsedServices.length > 0
        ? { slug, name, services: parsedServices }
        : null;
    })
    .filter((category): category is ServiceCatalogCategory => category !== null);
}

export interface PartnerApplicationSubmission {
  readonly businessName: string;
  readonly whatsapp: string;
  readonly email: string;
  readonly address: string;
  /**
   * Slugs de RUBRO del catalogo, no labels y no familias.
   *
   * La familia no viaja: es derivable —la jerarquia es estricta, cada rubro
   * cae en exactamente una— y mandarla ademas permitiria un payload que se
   * contradice a si mismo. El backend rechaza con 400 un slug de familia
   * aunque exista y este activo. Ver `fetchServiceCatalog`.
   */
  readonly declaredServices: string[];
  readonly declaredBrands: string[];
  readonly declaredFuelTypes: string[];
  readonly vehicleTypes: string[];
  readonly serviceOther?: string;
  readonly howFound?: string;
  readonly howFoundOther?: string;

  /**
   * Geocode de `address`, capturado al elegir una sugerencia de Google
   * Places. Los cuatro campos viajan juntos o ninguno — nunca coordenadas
   * sin `locality`/`province`, ni viceversa (ver
   * specs/004-partner-approval-data/contracts/partner-application-submission.md).
   */
  readonly latitude?: number;
  readonly longitude?: number;
  readonly locality?: string;
  readonly province?: string;
  readonly hours?: string;
  readonly modality?: "en_local" | "a_domicilio" | "ambas";
}

export type SubmitPartnerApplicationResult =
  | { readonly ok: true; readonly id: string }
  /**
   * `kind` existe para que la ruta pueda elegir el mensaje sin leer el texto
   * que devuelve el backend. Ese texto esta en ingles y es del dominio, no de
   * cara al usuario: acoplarse a el haria que cambiar una excepcion del backend
   * rompa un cartel de la landing.
   */
  | {
      readonly ok: false;
      readonly kind: "invalid" | "invalid-services" | "duplicate" | "unknown";
    };

/**
 * Traduce un 400 a un motivo que la landing pueda explicar.
 *
 * Hasta acá todos los 400 eran el mismo `kind`, y la ruta les mostraba a todos
 * el mensaje del WhatsApp. O sea que alguien que mandaba un servicio que ya no
 * existe leia "revisá el teléfono" y no tenia forma de acertar: el campo que
 * el cartel le señalaba estaba bien.
 *
 * Los dos casos se distinguen por la FORMA de la respuesta, no por el texto:
 * el ValidationPipe de Nest devuelve `message` como array y sin `code`; una
 * excepcion de dominio devuelve `message` string con `code`. Dentro de las de
 * dominio, la del catalogo si hay que reconocerla por el texto — es el punto
 * fragil de esto, y por eso vive acá adentro y en un solo lugar.
 *
 * Se busca la palabra "slug" y no la frase entera a proposito, y a esta altura
 * ya se gano el sueldo: el mensaje cambio DOS veces ("Unknown service slugs"
 * paso a "Unknown service category slugs" cuando el backend paso de rubros a
 * familias, y volvio a rubros cuando el formulario paso a dejar elegirlos).
 * Una condicion pegada a la redaccion se habria roto las dos veces sin que
 * nadie se enterara. "Slug" en cambio es vocabulario del catalogo: un error de
 * formato de telefono o de email no lo va a mencionar nunca.
 *
 * Y si aun asi deja de matchear, falla para el lado seguro: cae en "invalid",
 * que es exactamente lo que hacia antes de este cambio. Nunca queda peor.
 */
async function classifyBadRequest(
  response: Response,
): Promise<"invalid" | "invalid-services"> {
  const body = (await response.json().catch(() => null)) as {
    readonly message?: unknown;
  } | null;

  return typeof body?.message === "string" && /\bslugs?\b/i.test(body.message)
    ? "invalid-services"
    : "invalid";
}

/**
 * Registra la solicitud de un taller que quiere ser partner.
 *
 * Ojo con los codigos: el backend devuelve 409 cuando ese email YA tiene una
 * solicitud sin cerrar, y eso no es un error del usuario — es "ya te tenemos".
 * Tratarlo como falla generica haria que alguien que insiste crea que el
 * formulario esta roto.
 */
export async function submitPartnerApplication(
  submission: PartnerApplicationSubmission,
): Promise<SubmitPartnerApplicationResult> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/partner-applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
    // La landing puede estar cacheada; esta llamada nunca.
    cache: "no-store",
  });

  if (response.ok) {
    const payload = (await response.json()) as { id: string };
    return { ok: true, id: payload.id };
  }

  if (response.status === 409) return { ok: false, kind: "duplicate" };
  if (response.status === 400) {
    return { ok: false, kind: await classifyBadRequest(response) };
  }

  return { ok: false, kind: "unknown" };
}

/** Nivel del acuerdo comercial del partner. La landing no lo muestra. */
export type PartnerTier = "founding" | "standard";

/**
 * Un negocio del directorio (`GET /partner-profiles`), ya adaptado a lo que
 * pinta la landing. El listado del backend es liviano a propósito: trae el
 * rubro principal y la localidad, pero NO las marcas ni los rubros
 * secundarios. Por eso `brands` es `null` ("el listado no lo sabe") y no `[]`,
 * que significaría "todas las marcas": mostrar eso sería inventar un dato.
 */
export interface PartnerSummary {
  /** El slug: el backend no expone otro identificador público. */
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly logoUrl: string | null;
  /** Localidad del negocio; vacío si no la cargó. */
  readonly coverageZone: string;
  readonly tier: PartnerTier;
  /** Slugs de familia del catálogo. En el listado, solo la principal. */
  readonly categories: readonly string[];
  /** `null` = el listado no trae marcas; `[]` = todas las marcas. */
  readonly brands: readonly string[] | null;
  /**
   * El backend marca como indexables solo los perfiles con horarios
   * estructurados. Los demás van con `noindex` y fuera del sitemap.
   */
  readonly indexable: boolean;
}

export interface PartnersPage {
  readonly data: readonly PartnerSummary[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

/**
 * Una hora: el directorio cambia cuando el equipo aprueba o da de baja un
 * negocio, no minuto a minuto. Con `revalidate` la respuesta queda en el Data
 * Cache de Next y, si el backend falla al revalidar, se sigue sirviendo la
 * ultima respuesta buena (stale) hasta que vuelva: la pagina sobrevive a un
 * corte corto sin mostrar el estado de error.
 */
const PARTNERS_REVALIDATE_SECONDS = 3600;

/** Tope del backend para `pageSize`. */
const PARTNERS_MAX_PAGE_SIZE = 100;

/** Mismo patrón que valida el backend para un slug público. */
const PROFILE_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function textList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Pagina del directorio publico de partners activos, ya ordenada por el
 * backend (los aliados primero, despues nombre y slug). NO se reordena.
 *
 * A diferencia de `fetchServiceCatalog`, esto SI tira cuando el backend no
 * contesta: el directorio no tiene una version degradada que tenga sentido
 * (una grilla vacia diria "no hay negocios", que es falso). Quien renderiza
 * atrapa el error y muestra el estado de error de la seccion, sin tirar abajo
 * el resto de la pagina.
 *
 * Con `q` (busqueda por nombre) la peticion NO pasa por el Data Cache de Next:
 * el texto es libre, y cada busqueda distinta crearia una entrada de cache
 * que nadie va a volver a pedir. El backend ya responde con su propio
 * `Cache-Control`, y el volumen no pide mas. El costo: sin cache, un corte del
 * backend no se tapa con una respuesta vieja y la busqueda muestra el estado
 * de error (que es lo correcto: un error no es "sin resultados").
 */
export async function fetchPartners({
  category,
  q,
  zone,
  page = 1,
  pageSize = 24,
}: {
  /** Slug de familia del catalogo. Sin valor: todas. */
  readonly category?: string;
  /** Texto a buscar en el nombre del negocio. Vacio o sin valor: no busca. */
  readonly q?: string;
  /** Slug de zona (de `fetchPartnerZones`). Sin valor: todas. */
  readonly zone?: string;
  readonly page?: number;
  readonly pageSize?: number;
}): Promise<PartnersPage> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(Math.min(pageSize, PARTNERS_MAX_PAGE_SIZE)),
  });
  if (category) params.set("category", category);
  if (q) params.set("q", q);
  if (zone) params.set("zone", zone);

  const response = await fetch(
    `${apiBaseUrl()}/api/v1/partner-profiles?${params}`,
    q ? { cache: "no-store" } : { next: { revalidate: PARTNERS_REVALIDATE_SECONDS } },
  );

  if (!response.ok) {
    throw new Error(`[partners] el backend respondio ${response.status}.`);
  }

  return parsePartnersPage(await response.json());
}

/**
 * Una zona del desplegable. `count` es la cantidad de negocios que muestra
 * filtrar por ella, y ya incluye a los que cubren todo el pais.
 */
export interface PartnerZone {
  readonly slug: string;
  readonly name: string;
  readonly count: number;
}

/**
 * Las zonas con negocios, para el desplegable de `/proveedores` (el backend las
 * deriva de la zona de cobertura de cada negocio, partida en trozos).
 *
 * Tira si el backend no contesta, igual que `fetchPartners`: quien renderiza lo
 * atrapa y, sin la lista, NO ofrece el filtro por zona (el resto del
 * directorio sigue andando). Es una lista chica y estable, asi que va al Data
 * Cache una hora como el resto del directorio.
 */
export async function fetchPartnerZones(): Promise<PartnerZone[]> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/partner-profiles/facets/zones`, {
    next: { revalidate: PARTNERS_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`[partners] las zonas respondieron ${response.status}.`);
  }

  return parsePartnerZones(await response.json());
}

/** Descarta las zonas sin `slug` o sin `name` (no se pueden elegir ni mostrar). */
function parsePartnerZones(value: unknown): PartnerZone[] {
  const rawData = isRecord(value) && Array.isArray(value.data) ? value.data : [];

  return rawData
    .map((raw): PartnerZone | null => {
      if (!isRecord(raw)) return null;
      const slug = text(raw.slug);
      const name = text(raw.name);

      return slug && name ? { slug, name, count: finiteNumber(raw.count, 0) } : null;
    })
    .filter((zone): zone is PartnerZone => zone !== null);
}

/**
 * Parseo defensivo: un negocio sin `slug` o sin `name` no puede tener tarjeta
 * (no hay a donde linkear ni que mostrar), asi que se descarta en vez de
 * romper la grilla.
 *
 * Pero si el backend dice que hay negocios y NO sobrevive ninguno, no es un
 * negocio suelto mal cargado: es el contrato que cambio. Eso tira, para que la
 * pagina muestre el estado de error y no una grilla vacia que diga "0 de 41".
 * Una respuesta con `data` vacio (un rubro sin negocios) no es un error.
 */
function parsePartnersPage(value: unknown): PartnersPage {
  const payload = isRecord(value) ? value : {};
  const rawData = Array.isArray(payload.data) ? payload.data : [];
  let firstMissing: string | null = null;

  const data = rawData
    .map((raw): PartnerSummary | null => {
      if (!isRecord(raw)) {
        firstMissing ??= "(no es un objeto)";
        return null;
      }
      const slug = text(raw.slug);
      const name = text(raw.name);
      if (!slug || !name) {
        firstMissing ??= slug ? "name" : "slug";
        return null;
      }

      const primary = isRecord(raw.primaryCategory) ? text(raw.primaryCategory.slug) : null;
      return {
        id: slug,
        slug,
        name,
        logoUrl: isRecord(raw.logo) ? text(raw.logo.url) : null,
        coverageZone: text(raw.locality) ?? "",
        tier: raw.isAlly === true ? "founding" : "standard",
        categories: primary ? [primary] : [],
        brands: null,
        indexable: raw.indexable === true,
      };
    })
    .filter((partner): partner is PartnerSummary => partner !== null);

  const dropped = rawData.length - data.length;
  const total = finiteNumber(payload.total, data.length);

  if (rawData.length > 0 && data.length === 0 && total > 0) {
    throw new Error(
      `[partners] se descartaron los ${dropped} negocios de la respuesta (primer campo faltante: ${firstMissing}). ¿Cambio el contrato o es una respuesta vieja en cache?`,
    );
  }
  if (dropped > 0) {
    console.error(
      `[partners] se descartaron ${dropped} de ${rawData.length} negocios (primer campo faltante: ${firstMissing}).`,
    );
  }

  return {
    data,
    total,
    page: finiteNumber(payload.page, 1),
    pageSize: finiteNumber(payload.pageSize, data.length),
    totalPages: finiteNumber(payload.totalPages, 1),
  };
}

/**
 * El directorio COMPLETO (todas las paginas, `pageSize` maximo, sin filtro).
 * Una llamada por pagina, cada una cacheada como `fetchPartners`; con el
 * volumen actual (decenas de negocios) son un par. Tira si falla: lo usan
 * el sitemap y el calculo de rubros con negocios, que deciden su fallback.
 */
export async function fetchAllPartners(): Promise<PartnerSummary[]> {
  const partners: PartnerSummary[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await fetchPartners({ page, pageSize: PARTNERS_MAX_PAGE_SIZE });
    partners.push(...result.data);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);

  return partners;
}

/**
 * Slugs de las familias que tienen al menos un negocio activo, sacados del
 * directorio completo (`fetchAllPartners`) y no de una llamada por familia.
 * El listado solo trae el rubro PRINCIPAL de cada negocio: una familia que
 * aparece solo como rubro secundario no cuenta acá.
 *
 * Devuelve `null` —nunca tira— si algo falla: quien lo usa cae en mostrar
 * todas las familias del catalogo.
 */
export async function fetchActivePartnerCategories(): Promise<Set<string> | null> {
  try {
    const partners = await fetchAllPartners();
    return new Set(partners.flatMap((partner) => partner.categories));
  } catch (error) {
    console.error("[partners] no se pudieron leer los rubros con negocios:", error);
    return null;
  }
}

export type FuelType = "gasoline" | "diesel" | "cng" | "electric" | "hybrid";
const FUEL_TYPES: readonly FuelType[] = ["gasoline", "diesel", "cng", "electric", "hybrid"];

export type PartnerLinkKind =
  | "instagram"
  | "website"
  | "facebook"
  | "mercado_libre"
  | "x"
  | "tiktok"
  | "other";
const PARTNER_LINK_KINDS: readonly PartnerLinkKind[] = [
  "instagram",
  "website",
  "facebook",
  "mercado_libre",
  "x",
  "tiktok",
  "other",
];

export interface PartnerLink {
  readonly kind: PartnerLinkKind;
  readonly url: string;
}

/** Perfil completo de un negocio (`GET /partner-profiles/:slug`). */
export interface PartnerDetail extends PartnerSummary {
  /** En el perfil el backend sí conoce las marcas: `[]` = todas. */
  readonly brands: readonly string[];
  readonly description: string | null;
  /** Dirección completa, tal como la cargó el negocio. */
  readonly address: string | null;
  /** Link de WhatsApp del negocio (`https://wa.me/...`), si tiene. */
  readonly redirectLink: string | null;
  /** Slugs de rubro. */
  readonly services: readonly string[];
  /** Horarios ya armados como texto, uno por renglón; `null` si no hay. */
  readonly hours: string | null;
  /** Clave de `modalityLabel`: `en_local`, `a_domicilio` o `ambas`. */
  readonly modality: string | null;
  /** Entra completo o no entra. */
  readonly geo: { readonly latitude: number; readonly longitude: number } | null;
  /** Vacio = todos los combustibles. */
  readonly fuelTypes: readonly FuelType[];
  readonly links: readonly PartnerLink[];
}

/**
 * Resultado de pedir un perfil por slug. `moved`: el slug es histórico y el
 * backend informa el vigente; la página responde un redirect permanente.
 */
export type PartnerLookup =
  | { readonly status: "found"; readonly partner: PartnerDetail }
  | { readonly status: "moved"; readonly slug: string };

/**
 * Perfil de un negocio por su slug publico. `null` cuando el backend dice 404
 * (no existe, esta pausado o archivado) o el slug no tiene el formato valido
 * (el backend lo rechazaria con 400): la pagina responde `notFound()`.
 * Cualquier otro error TIRA: un backend caido no es "este negocio no existe",
 * y responder 404 haria que Google lo saque del indice.
 *
 * Mismo `revalidate` que el directorio; `fetch` ya memoiza la llamada dentro
 * de un render, y el `cache()` de React que la envuelve en la pagina lo hace
 * explicito para `generateMetadata` + la pagina.
 */
export async function fetchPartnerBySlug(slug: string): Promise<PartnerLookup | null> {
  if (!PROFILE_SLUG_PATTERN.test(slug) || slug.length > 120) return null;

  const response = await fetch(`${apiBaseUrl()}/api/v1/partner-profiles/${slug}`, {
    next: { revalidate: PARTNERS_REVALIDATE_SECONDS },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`[partner] el backend respondio ${response.status} para "${slug}".`);
  }

  const payload: unknown = await response.json();
  if (isRecord(payload) && payload.status === "moved") {
    const current = text(payload.slug);
    if (current && PROFILE_SLUG_PATTERN.test(current)) return { status: "moved", slug: current };
  }
  if (isRecord(payload) && payload.status === "ok") {
    const partner = parsePartnerProfile(payload.profile);
    if (partner) return { status: "found", partner };
  }

  throw new Error(`[partner] la respuesta de "${slug}" no cumple el contrato (status, slug o name).`);
}

/** `locationMode` del backend → clave que entiende `modalityLabel`. */
const MODALITY_BY_LOCATION_MODE: Readonly<Record<string, string>> = {
  in_person: "en_local",
  mobile: "a_domicilio",
  both: "ambas",
};

const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/**
 * `businessHours` estructurado → un renglón por día ("Lunes: 09:00–13:00,
 * 15:00–19:00"), en orden de lunes a domingo. El backend no documenta la
 * numeración de `weekday`: se asume la que comparten ISO y `Date#getDay` para
 * lo que importa, 1 a 6 = lunes a sábado y 0 o 7 = domingo. Un valor fuera de
 * 0–7 descarta ese día en vez de mostrar uno equivocado.
 */
function formatBusinessHours(value: unknown): string | null {
  const byDay = new Map<number, string>();

  for (const entry of records(value)) {
    const weekday = finiteNumber(entry.weekday, -1);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 7) continue;
    const index = weekday === 0 || weekday === 7 ? 6 : weekday - 1;

    const ranges = records(entry.ranges)
      .map((range) => {
        const opensAt = text(range.opensAt);
        const closesAt = text(range.closesAt);
        return opensAt && closesAt ? `${opensAt}–${closesAt}` : null;
      })
      .filter((range): range is string => range !== null);
    if (ranges.length > 0) byDay.set(index, ranges.join(", "));
  }

  if (byDay.size === 0) return null;
  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, ranges]) => `${WEEKDAY_NAMES[index]}: ${ranges}`)
    .join("\n");
}

/** `{ mode: "all" }` → `[]` (todas); `{ mode: "specific", items }` → los items. */
function selectionItems(value: unknown): string[] {
  return isRecord(value) && value.mode === "specific" ? textList(value.items) : [];
}

function parsePartnerProfile(value: unknown): PartnerDetail | null {
  if (!isRecord(value)) return null;
  const slug = text(value.slug);
  const name = text(value.name);
  if (!slug || !name) return null;

  const categorySlug = (entry: unknown) => (isRecord(entry) ? text(entry.slug) : null);
  const serviceGroups = records(value.services);
  const categories = [
    ...new Set(
      [
        categorySlug(value.primaryCategory),
        ...records(value.secondaryCategories).map(categorySlug),
        ...serviceGroups.map((group) => categorySlug(group.category)),
      ].filter((slugValue): slugValue is string => slugValue !== null),
    ),
  ];
  const services = serviceGroups.flatMap((group) =>
    records(group.items)
      .map(categorySlug)
      .filter((item): item is string => item !== null),
  );

  const address = isRecord(value.address) ? value.address : null;
  const latitude = address?.latitude;
  const longitude = address?.longitude;
  const geo =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
      ? { latitude, longitude }
      : null;

  const localities = isRecord(value.serviceArea)
    ? records(value.serviceArea.localities)
        .map((locality) => text(locality.name))
        .filter((locality): locality is string => locality !== null)
    : [];
  const coverageZone =
    localities.length > 0
      ? localities.join(", ")
      : [text(value.locality), text(value.province)].filter(Boolean).join(", ");

  // Solo links http(s): una URL rara en el admin no puede terminar en un
  // `href` con `javascript:` en la pagina publica. Un tipo que la landing no
  // conoce se muestra como "otro enlace" en vez de perderse.
  const links = records(value.links)
    .map((raw): PartnerLink | null => {
      const url = text(raw.url);
      if (!url || !/^https?:\/\//i.test(url)) return null;
      const kind = PARTNER_LINK_KINDS.find((known) => known === raw.kind) ?? "other";
      return { kind, url };
    })
    .filter((link): link is PartnerLink => link !== null);

  return {
    id: slug,
    slug,
    name,
    logoUrl: isRecord(value.logo) ? text(value.logo.url) : null,
    coverageZone,
    tier: value.isAlly === true ? "founding" : "standard",
    categories,
    brands: selectionItems(value.brands),
    indexable: value.indexable === true,
    description: text(value.description),
    address: address ? text(address.full) : null,
    redirectLink: isRecord(value.contact) ? text(value.contact.whatsappUrl) : null,
    services,
    hours: formatBusinessHours(value.businessHours),
    modality: MODALITY_BY_LOCATION_MODE[text(value.locationMode) ?? ""] ?? null,
    geo,
    fuelTypes: selectionItems(value.fuelTypes).filter((fuel): fuel is FuelType =>
      FUEL_TYPES.some((known) => known === fuel),
    ),
    links,
  };
}
