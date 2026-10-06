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
function apiBaseUrl(): string {
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
 * Un negocio del directorio (`GET /partners`), tal como lo devuelve el
 * backend. La pagina de aliados muestra solo una parte: `whatsapp`,
 * `address`, `redirectLink` y `tier` viajan pero no se pintan.
 */
export interface PartnerSummary {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly logoUrl: string | null;
  readonly whatsapp: string | null;
  readonly address: string | null;
  readonly redirectLink: string | null;
  readonly coverageZone: string;
  readonly tier: PartnerTier;
  /** Slugs de rubro. */
  readonly services: readonly string[];
  /** Slugs de FAMILIA del catalogo (derivadas de los rubros en el backend). */
  readonly categories: readonly string[];
  /** Vacio = trabaja con todas las marcas. */
  readonly brands: readonly string[];
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

/**
 * Pagina del directorio publico de partners activos, ya ordenada por el
 * backend (los `founding` primero, por contrato comercial). NO se reordena.
 *
 * A diferencia de `fetchServiceCatalog`, esto SI tira cuando el backend no
 * contesta: el directorio no tiene una version degradada que tenga sentido
 * (una grilla vacia diria "no hay negocios", que es falso). Quien renderiza
 * atrapa el error y muestra el estado de error de la seccion, sin tirar abajo
 * el resto de la pagina.
 */
export async function fetchPartners({
  category,
  page = 1,
  pageSize = 24,
}: {
  /** Slug de familia del catalogo. Sin valor: todas. */
  readonly category?: string;
  readonly page?: number;
  readonly pageSize?: number;
}): Promise<PartnersPage> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(Math.min(pageSize, PARTNERS_MAX_PAGE_SIZE)),
  });
  // `category` y `service` son excluyentes en el backend; la landing solo
  // filtra por familia.
  if (category) params.set("category", category);

  const response = await fetch(`${apiBaseUrl()}/api/v1/partners?${params}`, {
    next: { revalidate: PARTNERS_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`[partners] el backend respondio ${response.status}.`);
  }

  return parsePartnersPage(await response.json());
}

/** El primer campo obligatorio que le falta a un partner crudo, o `null`. */
function missingPartnerField(entry: Record<string, unknown>): string | null {
  if (typeof entry.id !== "string") return "id";
  if (typeof entry.slug !== "string" || entry.slug === "") return "slug";
  if (typeof entry.name !== "string" || entry.name.trim() === "") return "name";
  return null;
}

/**
 * Parseo defensivo, mismo criterio que el catalogo: un partner sin `slug` o
 * sin `name` no puede tener tarjeta (no hay a donde linkear ni que mostrar),
 * asi que se descarta en vez de romper la grilla.
 *
 * Pero si el backend dice que hay partners y NO sobrevive ninguno, no es un
 * partner suelto mal cargado: es el contrato que cambio (o una respuesta
 * vieja en cache, de antes de que existiera `slug`). Eso tira, para que la
 * pagina muestre el estado de error y no una grilla vacia que diga "0 de 41".
 * Una respuesta con `data` vacio (un rubro sin negocios) no es un error.
 */
function parsePartnersPage(value: unknown): PartnersPage {
  const payload = (typeof value === "object" && value !== null ? value : {}) as Record<
    string,
    unknown
  >;
  const toNumber = (input: unknown, fallback: number) =>
    typeof input === "number" && Number.isFinite(input) ? input : fallback;
  const toStrings = (input: unknown): string[] =>
    Array.isArray(input) ? input.filter((item): item is string => typeof item === "string") : [];
  const toNullableString = (input: unknown) =>
    typeof input === "string" && input.trim() !== "" ? input : null;

  const rawData: unknown[] = Array.isArray(payload.data) ? payload.data : [];
  let firstMissing: string | null = null;

  const data = rawData
    .map((raw): PartnerSummary | null => {
      if (typeof raw !== "object" || raw === null) {
        firstMissing ??= "(no es un objeto)";
        return null;
      }
      const entry = raw as Record<string, unknown>;
      const missing = missingPartnerField(entry);
      if (missing) {
        firstMissing ??= missing;
        return null;
      }

      return {
        id: entry.id as string,
        slug: entry.slug as string,
        name: entry.name as string,
        logoUrl: toNullableString(entry.logoUrl),
        whatsapp: toNullableString(entry.whatsapp),
        address: toNullableString(entry.address),
        redirectLink: toNullableString(entry.redirectLink),
        coverageZone: typeof entry.coverageZone === "string" ? entry.coverageZone : "",
        tier: entry.tier === "founding" ? "founding" : "standard",
        services: toStrings(entry.services),
        categories: toStrings(entry.categories),
        brands: toStrings(entry.brands),
      };
    })
    .filter((partner): partner is PartnerSummary => partner !== null);

  const dropped = rawData.length - data.length;
  const total = toNumber(payload.total, data.length);

  if (rawData.length > 0 && data.length === 0 && total > 0) {
    throw new Error(
      `[partners] se descartaron los ${dropped} partners de la respuesta (primer campo faltante: ${firstMissing}). ¿Cambio el contrato o es una respuesta vieja en cache?`,
    );
  }
  if (dropped > 0) {
    console.error(
      `[partners] se descartaron ${dropped} de ${rawData.length} partners (primer campo faltante: ${firstMissing}).`,
    );
  }

  return {
    data,
    total,
    page: toNumber(payload.page, 1),
    pageSize: toNumber(payload.pageSize, data.length),
    totalPages: toNumber(payload.totalPages, 1),
  };
}

/**
 * El directorio COMPLETO (todas las paginas, `pageSize` maximo, sin filtro).
 * Una llamada por pagina, cada una cacheada como `fetchPartners`; con el
 * volumen actual (decenas de negocios) es una sola. Tira si falla: lo usan
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
 * Slugs de las familias que tienen al menos un partner activo, sacados del
 * directorio completo (`fetchAllPartners`) y no de una llamada por familia.
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

/** Perfil completo de un negocio (`GET /partners/by-slug/:slug`). */
export interface PartnerDetail extends PartnerSummary {
  readonly description: string | null;
  readonly email: string | null;
  /** Texto libre, tal como lo cargo el equipo (no alcanza para "abierto ahora"). */
  readonly hours: string | null;
  /** Texto libre del backend ("en local", "a domicilio"...). */
  readonly modality: string | null;
  /** Entra completo o no entra. */
  readonly geo: { readonly latitude: number; readonly longitude: number } | null;
  /** Vacio = todos los combustibles. */
  readonly fuelTypes: readonly FuelType[];
  readonly links: readonly PartnerLink[];
}

/**
 * Perfil de un negocio por su slug publico. `null` cuando el backend dice 404
 * (no existe, esta inactivo o el slug es invalido): la pagina responde
 * `notFound()`. Cualquier otro error TIRA: un backend caido no es "este
 * negocio no existe", y responder 404 haria que Google lo saque del indice.
 *
 * Mismo `revalidate` que el directorio; `fetch` ya memoiza la llamada dentro
 * de un render, y el `cache()` de React que la envuelve en la pagina lo hace
 * explicito para `generateMetadata` + la pagina.
 */
export async function fetchPartnerBySlug(slug: string): Promise<PartnerDetail | null> {
  const response = await fetch(
    `${apiBaseUrl()}/api/v1/partners/by-slug/${encodeURIComponent(slug)}`,
    { next: { revalidate: PARTNERS_REVALIDATE_SECONDS } },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`[partner] el backend respondio ${response.status} para "${slug}".`);
  }

  const detail = parsePartnerDetail(await response.json());
  if (!detail) {
    throw new Error(`[partner] la respuesta de "${slug}" no cumple el contrato (falta id, slug o name).`);
  }
  return detail;
}

function parsePartnerDetail(value: unknown): PartnerDetail | null {
  if (typeof value !== "object" || value === null) return null;
  const entry = value as Record<string, unknown>;
  // Reusa el parseo de la tarjeta para los campos compartidos.
  const [summary] = parsePartnersPage({ data: [entry], total: 0 }).data;
  if (!summary) return null;

  const text = (input: unknown) =>
    typeof input === "string" && input.trim() !== "" ? input.trim() : null;
  const geoRaw = entry.geo as Record<string, unknown> | null | undefined;
  const geo =
    geoRaw &&
    typeof geoRaw.latitude === "number" &&
    typeof geoRaw.longitude === "number" &&
    Number.isFinite(geoRaw.latitude) &&
    Number.isFinite(geoRaw.longitude)
      ? { latitude: geoRaw.latitude, longitude: geoRaw.longitude }
      : null;

  const fuelTypes = (Array.isArray(entry.fuelTypes) ? entry.fuelTypes : []).filter(
    (fuel): fuel is FuelType => FUEL_TYPES.includes(fuel as FuelType),
  );

  // Solo links http(s): una URL rara en el admin no puede terminar en un
  // `href` con `javascript:` en la pagina publica.
  const links = (Array.isArray(entry.links) ? entry.links : [])
    .map((raw): PartnerLink | null => {
      if (typeof raw !== "object" || raw === null) return null;
      const { kind, url } = raw as Record<string, unknown>;
      if (!PARTNER_LINK_KINDS.includes(kind as PartnerLinkKind) || typeof url !== "string") {
        return null;
      }
      return /^https?:\/\//i.test(url.trim()) ? { kind: kind as PartnerLinkKind, url: url.trim() } : null;
    })
    .filter((link): link is PartnerLink => link !== null);

  return {
    ...summary,
    description: text(entry.description),
    email: text(entry.email),
    hours: text(entry.hours),
    modality: text(entry.modality),
    geo,
    fuelTypes,
    links,
  };
}
