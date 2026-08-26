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
  const url = process.env.AUTOLIBRE_API_URL?.trim().replace(/\/+$/, "");

  if (!url) {
    throw new Error(
      "Falta AUTOLIBRE_API_URL: la landing no sabe a que backend mandar las solicitudes de partner.",
    );
  }

  return url;
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
