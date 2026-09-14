import { NextRequest, NextResponse } from "next/server";

/**
 * Mismos 4 patrones que `Plate` en autolibre-backend-hex
 * (src/shared/domain/value-objects/plate.vo.ts): dos regímenes (auto/moto),
 * cada uno con su forma legacy y Mercosur.
 */
const PLATE_PATTERNS: readonly RegExp[] = [
  /^[A-Z]{3}\d{3}$/,
  /^[A-Z]{2}\d{3}[A-Z]{2}$/,
  /^\d{3}[A-Z]{3}$/,
  /^[A-Z]\d{3}[A-Z]{3}$/,
];

function canonicalPlate(raw: string): string | null {
  const stripped = raw.trim().toUpperCase().replace(/[\s-]/g, "");
  return PLATE_PATTERNS.some((pattern) => pattern.test(stripped)) ? stripped : null;
}

const PLACEHOLDER_VALUES = new Set(["AUTOMOTOR", "DESCONOCIDO"]);

/** Filtra los placeholders que clasific.ar a veces devuelve en vez de un miss real. */
function identifiesVehicle(make: unknown, model: unknown): boolean {
  if (typeof make !== "string" || typeof model !== "string" || !make || !model) {
    return false;
  }
  return !PLACEHOLDER_VALUES.has(make.toUpperCase()) && !PLACEHOLDER_VALUES.has(model.toUpperCase());
}

type LookupResponse =
  | { found: true; brand: string; model: string; year: number | null }
  | { found: false; searching?: true }
  | { found: false; error: "unavailable" };

/**
 * Cache en memoria del proceso — no sobrevive un cold start serverless, pero
 * evita reconsultar clasific.ar (cupo diario compartido) por clicks
 * repetidos de la misma patente en la misma instancia. Suficiente para el
 * volumen de un MVP.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; body: LookupResponse }>();

export async function GET(req: NextRequest) {
  const plate = canonicalPlate(req.nextUrl.searchParams.get("plate") ?? "");

  if (!plate) {
    return NextResponse.json({ found: false, error: "invalid_plate" }, { status: 400 });
  }

  const cached = cache.get(plate);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.body);
  }

  const apiKey = process.env.CLASIFIC_API_KEY;
  const baseUrl = process.env.CLASIFIC_API_BASE_URL ?? "https://api.clasific.ar";

  if (!apiKey) {
    return NextResponse.json({ found: false, error: "unavailable" } satisfies LookupResponse);
  }

  try {
    const response = await fetch(
      `${baseUrl}/v1/vehicles/basic?plate=${encodeURIComponent(plate)}&classification=true&onMiss=search`,
      { headers: { "x-api-key": apiKey } },
    );

    if (!response.ok) {
      // 429 (cupo agotado) o 403 (plan) incluidos: nunca rompemos la UI por esto.
      return NextResponse.json({ found: false, error: "unavailable" } satisfies LookupResponse);
    }

    const payload = await response.json();

    if (payload?.found === false) {
      const body: LookupResponse = { found: false };
      cache.set(plate, { expiresAt: Date.now() + CACHE_TTL_MS, body });
      return NextResponse.json(body);
    }

    if (payload?.data === null && payload?.status?.state === "searching") {
      return NextResponse.json({ found: false, searching: true } satisfies LookupResponse);
    }

    const data = payload?.data;
    if (!identifiesVehicle(data?.make, data?.model)) {
      const body: LookupResponse = { found: false };
      cache.set(plate, { expiresAt: Date.now() + CACHE_TTL_MS, body });
      return NextResponse.json(body);
    }

    const body: LookupResponse = {
      found: true,
      brand: data.make,
      model: data.model,
      year: typeof data.year === "number" ? data.year : null,
    };
    cache.set(plate, { expiresAt: Date.now() + CACHE_TTL_MS, body });
    return NextResponse.json(body);
  } catch (error) {
    console.error("[vehicle-lookup] clasific.ar request failed", error);
    return NextResponse.json({ found: false, error: "unavailable" } satisfies LookupResponse);
  }
}
