import { NextRequest, NextResponse } from "next/server";
import { submitPartnerApplication } from "@/lib/autolibre-api";
import { providersContent } from "@/lib/content/providers";
import {
  PROVIDER_LOGO_MAX_BYTES,
  validBrandSelection,
  parseProviderProfileFields,
} from "@/lib/proveedores/registration";

/**
 * Alta de un taller que quiere ser partner.
 *
 * ── Esto ya no escribe en el Google Sheet ───────────────────────────────────
 *
 * Antes cargaba la fila directo en la planilla. El cambio al backend no fue
 * solo prolijidad: la version anterior tenia tres problemas concretos.
 *
 *   1. Buscaba la primera fila libre y DESPUES escribia, sin lock. Dos talleres
 *      anotandose a la vez escribian en la misma fila y el segundo pisaba al
 *      primero — sin error, sin sintoma, sin forma de enterarse.
 *   2. Todo lo que no tenia columna propia —tipos de vehiculo, como nos
 *      conocio, el servicio "otro"— se concatenaba en la celda "Notas" y
 *      dejaba de ser un dato consultable.
 *   3. Los servicios viajaban con los labels de ESTE formulario en vez del
 *      vocabulario del catalogo. El mapa que traducia existia y nunca se
 *      aplicaba, asi que el taller terminaba sin ninguna categoria e invisible
 *      en la app aunque estuviera aprobado.
 *
 * Los tres desaparecen del lado del backend: la unicidad la garantiza un indice
 * de Postgres, cada campo tiene su columna, y la traduccion al catalogo pasa a
 * ser un paso explicito de la aprobacion.
 */

/**
 * Mensajes de cara al usuario. El backend responde en ingles y en vocabulario
 * de dominio: leerlo para mostrarlo haria que cambiar una excepcion alla rompa
 * un cartel acá.
 */
const MESSAGES = {
  missing: "Faltan datos obligatorios.",
  /**
   * Ojo con el tono: esto se muestra cuando el backend rechazo el FORMATO de
   * algun campo, y no sabemos de cual. Por eso sugiere en vez de afirmar — la
   * version anterior daba por hecho que el problema era el telefono, y cuando
   * no lo era mandaba a la persona a corregir un campo que estaba bien.
   */
  invalid:
    "Revisá los datos: hay un campo con un formato que no podemos aceptar. " +
    "Si escribiste el WhatsApp con el 15 adelante, probá sin él (por ejemplo " +
    "11 2512-0472).",
  /**
   * El catalogo se cachea hasta cinco minutos, asi que alguien puede estar
   * completando el formulario con una lista que dejo de estar vigente. No es
   * culpa suya y no se arregla revisando ningun campo: se arregla recargando,
   * y hay que decirselo.
   */
  "invalid-services":
    "El listado de servicios se actualizó mientras completabas el " +
    "formulario. Recargá la página y volvé a marcar los tuyos.",
  duplicate:
    "Ya tenemos tu solicitud con ese email y la estamos revisando. Te vamos a " +
    "escribir por WhatsApp.",
  unknown: "Algo salió mal. Por favor intentá de nuevo.",
} as const;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

/** Vacío y ausente son lo mismo: el backend rechaza los strings en blanco. */
const asOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const asOptionalNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const MODALITY_VALUES = ["en_local", "a_domicilio", "ambas"] as const;
type Modality = (typeof MODALITY_VALUES)[number];

const asOptionalModality = (value: unknown): Modality | undefined =>
  typeof value === "string" &&
  (MODALITY_VALUES as readonly string[]).includes(value)
    ? (value as Modality)
    : undefined;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: MESSAGES.invalid }, { status: 400 });
  }

  const businessName = asOptionalString(body.taller);
  const whatsapp = asOptionalString(body.whatsapp);
  const email = asOptionalString(body.email);
  const address = asOptionalString(body.direccion);

  if (!businessName || !whatsapp || !email || !address) {
    return NextResponse.json({ error: MESSAGES.missing }, { status: 400 });
  }

  const profile = parseProviderProfileFields(body.description, body.social_links);
  if (!profile.ok) {
    return NextResponse.json({ error: profile.kind === "description" ? providersContent.form.description.invalid : providersContent.form.social.invalid }, { status: 400 });
  }

  // Conserva compatibilidad con formularios abiertos antes de este deploy.
  const hasBrandCoverage = typeof body.works_all_brands === "boolean";
  const worksAllBrands = hasBrandCoverage
    ? body.works_all_brands === true
    : body.brand_specialized === "no";
  const declaredBrands = worksAllBrands ? [] : asStringArray(body.brands);
  const specializedBrands = asStringArray(body.specialized_brands);
  if (
    hasBrandCoverage &&
    !validBrandSelection(worksAllBrands, declaredBrands, specializedBrands)
  ) {
    return NextResponse.json(
      { error: providersContent.form.brands.invalid },
      { status: 400 },
    );
  }
  const logoDataUrl = asOptionalString(body.logo_data_url);
  if (
    logoDataUrl &&
    (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
      logoDataUrl,
    ) ||
      Buffer.byteLength(logoDataUrl.split(",")[1], "base64") >
        PROVIDER_LOGO_MAX_BYTES)
  ) {
    return NextResponse.json(
      { error: providersContent.form.logo.invalid },
      { status: 400 },
    );
  }

  // Geocode de `address`, capturado en el cliente al elegir una sugerencia de
  // Google Places. Los cuatro viajan juntos o ninguno (el formulario ya lo
  // garantiza), pero se revalida acá tambien: nunca mandar coordenadas sin
  // localidad/provincia al backend, ni viceversa.
  const latitude = asOptionalNumber(body.latitude);
  const longitude = asOptionalNumber(body.longitude);
  const locality = asOptionalString(body.locality);
  const province = asOptionalString(body.province);
  const hasGeo =
    latitude !== undefined &&
    longitude !== undefined &&
    locality !== undefined &&
    province !== undefined;

  const result = await submitPartnerApplication({
    businessName,
    whatsapp,
    email,
    address,
    ...(profile.description ? { description: profile.description } : {}),
    ...(profile.socialLinks ? { socialLinks: profile.socialLinks } : {}),
    declaredServices: asStringArray(body.services),
    declaredBrands,
    ...(hasBrandCoverage ? { worksAllBrands, specializedBrands } : {}),
    ...(logoDataUrl ? { logoDataUrl } : {}),
    declaredFuelTypes: asStringArray(body.fuel_types),
    // Estos tres se perdian dentro de la celda "Notas". Ahora tienen columna.
    vehicleTypes: asStringArray(body.vehicle_types),
    serviceOther: asOptionalString(body.service_other),
    howFound: asOptionalString(body.how_found),
    howFoundOther: asOptionalString(body.how_found_other),
    ...(hasGeo ? { latitude, longitude, locality, province } : {}),
    hours: asOptionalString(body.hours),
    modality: asOptionalModality(body.modality),
  });

  if (result.ok) {
    return NextResponse.json({ success: true, id: result.id });
  }

  // El 409 del backend sale de acá como EXITO con un mensaje. Para la persona
  // que completa el formulario, "ya te tenemos anotado" no es un fallo: un
  // cartel rojo la haria reintentar o pensar que el sitio esta roto.
  if (result.kind === "duplicate") {
    return NextResponse.json({
      success: true,
      alreadyRegistered: true,
      message: MESSAGES.duplicate,
    });
  }

  // 502 solo para `unknown`: ahi el que fallo es el backend, no esta ruta ni
  // quien completo el formulario. Los dos sabores de "invalid" son 400 porque
  // hay algo que la persona puede corregir.
  return NextResponse.json(
    { error: MESSAGES[result.kind] },
    { status: result.kind === "unknown" ? 502 : 400 },
  );
}
