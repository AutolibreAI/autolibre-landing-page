import { NextRequest, NextResponse } from "next/server";
import { appendConsentToSheet } from "@/lib/google-sheet";

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

/** Versión del texto de consentimiento mostrado en el modal — se guarda para auditoría. */
const CONSENT_TEXT_VERSION = "2026-09";

/**
 * Registra el pedido en `autolibre-backend-hex` vía su endpoint público
 * `POST /api/v1/quote-requests` (canal "web", sin auth — pensado para esto,
 * ver autolibre-ddl-ddd.md). No mandamos `vehicleId`: ese campo espera un
 * `vehicles.id` de una cuenta logueada, no el resultado anónimo del lookup
 * de /api/vehicle-lookup.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { plate: rawPlate, description, contactPhone, contactEmail, consent } = body;

  const plate = canonicalPlate(rawPlate);
  const phoneDigits = typeof contactPhone === "string" ? contactPhone.replace(/\D/g, "") : "";
  const trimmedDescription = typeof description === "string" ? description.trim() : "";

  if (!plate) {
    return NextResponse.json({ error: "Ingresá una patente válida." }, { status: 400 });
  }
  if (phoneDigits.length < 8) {
    return NextResponse.json({ error: "Ingresá un WhatsApp válido." }, { status: 400 });
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

  const apiUrl = process.env.AUTOLIBRE_API_URL;
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

    if (id) {
      try {
        await appendConsentToSheet({
          plate,
          contactPhone: String(contactPhone).trim(),
          contactEmail: trimmedEmail,
          quoteRequestId: id,
          consentVersion: CONSENT_TEXT_VERSION,
        });
      } catch (error) {
        // El pedido ya quedó registrado en el backend (fuente de verdad):
        // que falle el log de auditoría no puede tumbar la respuesta.
        console.error("[presupuesto] no se pudo registrar el consentimiento en la sheet", error);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[presupuesto] error al llamar al backend", error);
    return NextResponse.json(
      { error: "No pudimos registrar tu pedido. Por favor intentá de nuevo." },
      { status: 502 },
    );
  }
}
