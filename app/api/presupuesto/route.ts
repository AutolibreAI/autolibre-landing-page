import { after, NextRequest, NextResponse } from "next/server";
import { sendMetaCapiEvent } from "@/lib/analytics/meta-capi";
import { META_EVENTS } from "@/lib/analytics/meta-pixel";
import { whatsappErrorMessage } from "@/lib/content/presupuesto";
import { parseArWhatsapp } from "@/lib/phone";
import { canonicalPlate } from "@/lib/plate";
import { siteConfig } from "@/lib/seo/config";
import { VEHICLE_LOOKUP_LIMITS, type VehicleLookupSnapshot } from "@/lib/vehicle-lookup";

/**
 * ID de deduplicación que genera el navegador (`createMetaEventId`). Es
 * opcional y nunca invalida el pedido: si no viene o no tiene forma de UUID
 * razonable, simplemente no se manda el `Lead` server-side (sin ID, Meta lo
 * contaría dos veces junto con el del Pixel).
 */
const META_EVENT_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

function metaEventIdOrNull(raw: unknown): string | null {
  return typeof raw === "string" && META_EVENT_ID_PATTERN.test(raw) ? raw : null;
}

/** Primer hop de `x-forwarded-for` (el cliente real detrás del proxy). */
function clientIpFrom(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || undefined;
}

/**
 * Patente opcional: ausente o vacía es `undefined` (el pedido entra sin
 * patente); presente pero mal formada es `null` (400). Vacía cuenta como
 * ausente porque el form de `/pedido` puede mandar el campo sin completar.
 */
function optionalPlate(raw: unknown): string | null | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "string" && raw.trim() === "") return undefined;
  return canonicalPlate(raw);
}

/**
 * `AUTOLIBRE_API_URL` tiene que ser la base sin `/api/v1` (misma convención
 * que `lib/autolibre-api.ts`), pero si alguien la carga con el sufijo puesto
 * (típico al copiar la URL de Swagger) el fetch de abajo terminaba pidiendo
 * `/api/v1/api/v1/quote-requests` y el backend respondía 404. Se normaliza
 * acá para no depender de que la variable esté cargada exactamente bien.
 */
function normalizeApiBaseUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.replace(/\/api\/v1$/i, "") || null;
}

function finiteCoordinate(raw: unknown): number | null {
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

function trimmedOrNull(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * `device` y no `typed` cuando hay coordenadas: la landing no tiene GPS, pero
 * una sugerencia elegida en el Autocomplete de Google Places trae un geocode
 * tan confiable como el del teléfono — el modal solo manda lat/lng cuando
 * vienen de ahí (se limpian si la persona edita el texto a mano). Sin
 * coordenadas, es `typed`: la persona escribió la dirección sin elegir
 * ninguna sugerencia.
 */
function buildLocation(
  address: string,
  rawLatitude: unknown,
  rawLongitude: unknown,
  rawLocality: unknown,
  rawProvince: unknown,
) {
  const latitude = finiteCoordinate(rawLatitude);
  const longitude = finiteCoordinate(rawLongitude);

  if (latitude === null || longitude === null) {
    return { source: "typed" as const, address };
  }

  return {
    source: "device" as const,
    latitude,
    longitude,
    address,
    locality: trimmedOrNull(rawLocality) ?? undefined,
    province: trimmedOrNull(rawProvince) ?? undefined,
  };
}

function boundedOrNull(raw: unknown, max: number): string | null {
  const value = trimmedOrNull(raw);
  return value !== null && value.length <= max ? value : null;
}

/**
 * Rearma el snapshot de clasific.ar campo por campo. Llega del browser, así
 * que es dato del cliente: se reconstruye con solo los campos que el DTO del
 * backend declara (un campo de más daría 400 por `forbidNonWhitelisted`) y con
 * sus mismos límites.
 *
 * Ante cualquier cosa rara devuelve `undefined` y el pedido viaja sin el
 * campo: es opcional, y un lookup malformado nunca puede hacer fallar un alta
 * que sin él entraba. Lo mismo si la patente consultada no es la del pedido.
 */
function buildVehicleLookup(raw: unknown, plate: string): VehicleLookupSnapshot | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const snapshot = raw as Record<string, unknown>;

  if (canonicalPlate(snapshot.queriedPlate) !== plate) return undefined;

  const make = boundedOrNull(snapshot.make, VEHICLE_LOOKUP_LIMITS.make);
  const model = boundedOrNull(snapshot.model, VEHICLE_LOOKUP_LIMITS.model);
  if (!make || !model) return undefined;

  const fetchedAtMs =
    typeof snapshot.fetchedAt === "string" ? Date.parse(snapshot.fetchedAt) : Number.NaN;
  if (Number.isNaN(fetchedAtMs)) return undefined;

  const year =
    Number.isInteger(snapshot.year) &&
    (snapshot.year as number) >= VEHICLE_LOOKUP_LIMITS.minYear &&
    (snapshot.year as number) <= VEHICLE_LOOKUP_LIMITS.maxYear
      ? (snapshot.year as number)
      : null;

  let currentLocation: VehicleLookupSnapshot["currentLocation"] = null;
  if (snapshot.currentLocation && typeof snapshot.currentLocation === "object") {
    const { city, province } = snapshot.currentLocation as Record<string, unknown>;
    const location = {
      city: boundedOrNull(city, VEHICLE_LOOKUP_LIMITS.locationArea),
      province: boundedOrNull(province, VEHICLE_LOOKUP_LIMITS.locationArea),
    };
    currentLocation = location.city || location.province ? location : null;
  }

  return {
    queriedPlate: plate,
    fetchedAt: new Date(fetchedAtMs).toISOString(),
    make,
    model,
    year,
    currentLocation,
  };
}

/**
 * Registra el pedido en `autolibre-backend-hex` vía su endpoint público
 * `POST /api/v1/quote-requests` (canal "web", sin auth — pensado para esto,
 * ver autolibre-ddl-ddd.md). No mandamos `vehicleId`: ese campo espera un
 * `vehicles.id` de una cuenta logueada, no el resultado anónimo del lookup
 * de /api/vehicle-lookup. Ese resultado viaja aparte, como `vehicleLookup`
 * (ver `buildVehicleLookup`), y el backend lo deja en `raw_submission`.
 *
 * Dos clientes: el modal de la home (patente obligatoria + checkbox de
 * consentimiento + snapshot del auto confirmado) y el form de `/pedido`
 * (patente opcional + snapshot si la validó, y el envío mismo es el
 * consentimiento: manda `consent: true`). El lookup de la patente lo hace
 * SIEMPRE el browser contra `/api/vehicle-lookup`: esta route no consulta
 * clasific.ar (sería una segunda llamada con cuota por el mismo pedido).
 *
 * El WhatsApp se valida con `parseArWhatsapp` (la misma regla que los forms)
 * y viaja normalizado (`549XXXXXXXXXX`): es la forma canónica que guarda el
 * `WhatsappNumber` del backend, que además RECHAZA el `15` local
 * (`11 15 2345 6789`) que acá sí sabemos sacar.
 *
 * Responde `{ success, id, publicCode }`; `publicCode` es `AL-1042`.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    plate: rawPlate,
    description,
    contactPhone,
    address,
    latitude,
    longitude,
    locality,
    province,
    contactEmail,
    consent,
    vehicleLookup: rawVehicleLookup,
    metaEventId: rawMetaEventId,
  } = body;

  const plate = optionalPlate(rawPlate);
  const phone = parseArWhatsapp(contactPhone);
  const trimmedDescription = typeof description === "string" ? description.trim() : "";
  const trimmedAddress = typeof address === "string" ? address.trim() : "";

  if (plate === null) {
    return NextResponse.json({ error: "Ingresá una patente válida." }, { status: 400 });
  }
  if (!phone.ok) {
    return NextResponse.json(
      { error: whatsappErrorMessage(phone.error, phone.diff) },
      { status: 400 },
    );
  }
  if (!trimmedAddress) {
    return NextResponse.json({ error: "Ingresá una dirección válida." }, { status: 400 });
  }
  if (!trimmedDescription) {
    return NextResponse.json({ error: "Contanos qué necesita tu auto." }, { status: 400 });
  }
  if (consent !== true) {
    return NextResponse.json(
      { error: "Necesitamos tu consentimiento explícito para continuar." },
      { status: 400 },
    );
  }

  const apiUrl = normalizeApiBaseUrl(process.env.AUTOLIBRE_API_URL);
  if (!apiUrl) {
    return NextResponse.json(
      { error: "El servicio no está disponible en este momento." },
      { status: 503 },
    );
  }

  const trimmedEmail = typeof contactEmail === "string" ? contactEmail.trim() : "";
  // Snapshot del lookup que hizo el browser (modal: auto confirmado; `/pedido`:
  // patente validada). Sin patente nunca viaja: el backend da 400 si llega
  // `vehicleLookup` sin `plate`.
  const vehicleLookup = plate ? buildVehicleLookup(rawVehicleLookup, plate) : undefined;

  try {
    const response = await fetch(`${apiUrl}/api/v1/quote-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "web",
        // Opcional en el backend: sin patente el campo no viaja.
        ...(plate ? { plate } : {}),
        description: trimmedDescription,
        contactPhone: phone.canonical,
        location: buildLocation(trimmedAddress, latitude, longitude, locality, province),
        ...(trimmedEmail ? { contactEmail: trimmedEmail } : {}),
        ...(vehicleLookup ? { vehicleLookup } : {}),
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.message ?? "No pudimos registrar tu pedido. Por favor intentá de nuevo.";
      return NextResponse.json(
        { error: Array.isArray(message) ? message.join(" ") : message },
        { status: response.status >= 500 ? 502 : 400 },
      );
    }

    const id = data?.id as string | undefined;
    // Código corto y legible del pedido (`AL-1042`, sin `#`: el `#` lo pone
    // la UI) para mostrárselo a la persona y que lo cite por WhatsApp. El
    // backend siempre lo manda; si igual faltara, la UI lo omite.
    const publicCode =
      typeof data?.publicCode === "string" && data.publicCode.trim() !== ""
        ? data.publicCode.trim().replace(/^#+/, "")
        : null;

    // `Lead` server-side SOLO con el pedido ya registrado, y con `after()` para
    // no demorar la respuesta. Headers y cookies se leen acá, no adentro del
    // callback: el request ya está en mano y no hace falta `headers()`.
    const metaEventId = metaEventIdOrNull(rawMetaEventId);
    if (metaEventId) {
      const capiEvent = {
        eventName: META_EVENTS.lead,
        eventId: metaEventId,
        eventSourceUrl: req.headers.get("referer") || `${siteConfig.url}/pedido`,
        clientIp: clientIpFrom(req),
        userAgent: req.headers.get("user-agent") || undefined,
        fbp: req.cookies.get("_fbp")?.value,
        fbc: req.cookies.get("_fbc")?.value,
        // Se hashea en `sendMetaCapiEvent`: a Meta sólo llega el SHA-256.
        phone: phone.canonical,
      };
      after(() => sendMetaCapiEvent(capiEvent));
    }

    return NextResponse.json({ success: true, id, publicCode });
  } catch (error) {
    console.error("[presupuesto] error al llamar al backend", error);
    return NextResponse.json(
      { error: "No pudimos registrar tu pedido. Por favor intentá de nuevo." },
      { status: 502 },
    );
  }
}
