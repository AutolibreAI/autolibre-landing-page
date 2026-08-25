import { NextRequest, NextResponse } from "next/server";
import { submitPartnerApplication } from "@/lib/autolibre-api";

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
  invalid:
    "Revisá los datos. El WhatsApp tiene que ser un celular argentino con " +
    "código de área (por ejemplo 11 2512-0472); si lo escribís con el 15, " +
    "sacáselo.",
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

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Record<string, unknown>;

  const businessName = asOptionalString(body.taller);
  const whatsapp = asOptionalString(body.whatsapp);
  const email = asOptionalString(body.email);
  const address = asOptionalString(body.direccion);

  if (!businessName || !whatsapp || !email || !address) {
    return NextResponse.json({ error: MESSAGES.missing }, { status: 400 });
  }

  // `brand_specialized` NO se reenvia: el backend lo DERIVA de si vinieron
  // marcas o no. En el legacy eran tres campos diciendo lo mismo (`brands`,
  // `brand_specialized`, `specialized_brands`) y podian contradecirse entre si.
  // Acá se traduce a lo unico que importa: si el taller dijo que trabaja todas
  // las marcas, no se manda ninguna.
  const worksAllBrands = body.brand_specialized === "no";

  const result = await submitPartnerApplication({
    businessName,
    whatsapp,
    email,
    address,
    declaredServices: asStringArray(body.services),
    declaredBrands: worksAllBrands ? [] : asStringArray(body.brands),
    declaredFuelTypes: asStringArray(body.fuel_types),
    // Estos tres se perdian dentro de la celda "Notas". Ahora tienen columna.
    vehicleTypes: asStringArray(body.vehicle_types),
    serviceOther: asOptionalString(body.service_other),
    howFound: asOptionalString(body.how_found),
    howFoundOther: asOptionalString(body.how_found_other),
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

  // 502 y no 500 para `unknown`: el que fallo es el backend, no esta ruta.
  // La distincion importa cuando alguien mire los logs del hosting.
  return NextResponse.json(
    { error: MESSAGES[result.kind] },
    { status: result.kind === "invalid" ? 400 : 502 },
  );
}
