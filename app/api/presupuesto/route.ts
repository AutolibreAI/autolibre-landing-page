import { NextRequest, NextResponse } from "next/server";

const PLATE_PATTERNS: readonly RegExp[] = [
  /^[A-Z]{3}\d{3}$/,
  /^[A-Z]{2}\d{3}[A-Z]{2}$/,
  /^\d{3}[A-Z]{3}$/,
  /^[A-Z]\d{3}[A-Z]{3}$/,
];

function canonicalPlate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const stripped = raw.trim().toUpperCase().replace(/[\s-]/g, "");
  return PLATE_PATTERNS.some((pattern) => pattern.test(stripped)) ? stripped : null;
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

/**
 * Registra el pedido en `autolibre-backend-hex` vía su endpoint público
 * `POST /api/v1/quote-requests` (canal "web", sin auth — pensado para esto,
 * ver autolibre-ddl-ddd.md). No mandamos `vehicleId`: ese campo espera un
 * `vehicles.id` de una cuenta logueada, no el resultado anónimo del lookup
 * de /api/vehicle-lookup.
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
  } = body;

  const plate = canonicalPlate(rawPlate);
  const phoneDigits = typeof contactPhone === "string" ? contactPhone.replace(/\D/g, "") : "";
  const trimmedDescription = typeof description === "string" ? description.trim() : "";
  const trimmedAddress = typeof address === "string" ? address.trim() : "";

  if (!plate) {
    return NextResponse.json({ error: "Ingresá una patente válida." }, { status: 400 });
  }
  if (phoneDigits.length < 8) {
    return NextResponse.json({ error: "Ingresá un WhatsApp válido." }, { status: 400 });
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

  try {
    const response = await fetch(`${apiUrl}/api/v1/quote-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "web",
        plate,
        description: trimmedDescription,
        contactPhone: String(contactPhone).trim(),
        location: buildLocation(trimmedAddress, latitude, longitude, locality, province),
        ...(trimmedEmail ? { contactEmail: trimmedEmail } : {}),
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

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[presupuesto] error al llamar al backend", error);
    return NextResponse.json(
      { error: "No pudimos registrar tu pedido. Por favor intentá de nuevo." },
      { status: 502 },
    );
  }
}
