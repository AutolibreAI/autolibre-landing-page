import { after, NextRequest, NextResponse } from "next/server";
import { sendMetaCapiEvent } from "@/lib/analytics/meta-capi";
import {
  ANALYTICS_CATALOG,
  ANALYTICS_EVENTS,
  LEAD_SOURCES,
  QUOTE_FLOWS,
  QUOTE_MODULE_PLACEMENTS,
  type AnalyticsProps,
  type QuoteModulePlacement,
} from "@/lib/analytics/events";
import { capturePostHogServerEvent, posthogIdOrNull } from "@/lib/analytics/posthog-server";
import { apiBaseUrl } from "@/lib/autolibre-api";
import { inquiryRejection, parseInquiry, type InquiryError } from "@/lib/consulta-inquiry";
import { moduloPedidoContent } from "@/lib/content/modulo-pedido";
import { siteConfig } from "@/lib/seo/config";

const errors = moduloPedidoContent.consultaErrors;

/** Mismo criterio que `/api/presupuesto`: sin ID razonable, no hay evento server-side. */
const META_EVENT_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

const QUOTE_MODULE_PLACEMENT_VALUES = new Set<string>(Object.values(QUOTE_MODULE_PLACEMENTS));

function placementOrNull(raw: unknown): QuoteModulePlacement | null {
  return typeof raw === "string" && QUOTE_MODULE_PLACEMENT_VALUES.has(raw)
    ? (raw as QuoteModulePlacement)
    : null;
}

/** Primer hop de `x-forwarded-for` (el cliente real detrás del proxy). */
function clientIpFrom(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || undefined;
}

function failure(body: InquiryError, status: number) {
  return NextResponse.json(body, { status });
}

/**
 * Registra una consulta de Seguros o de Financiación en
 * `autolibre-backend-hex`: `POST /api/v1/inquiries/insurance` o
 * `/financing` (públicos, sin auth). Recibe `{ kind, values, consent }` del
 * form del módulo de pedido (`ModuloConsultaForm`), más datos de medición
 * opcionales (`placement`, `metaEventId`, ids anónimos de PostHog), y
 * responde `{ success, id, publicCode }` (`SG-1001` / `FN-1001`) o
 * `{ error, field? }`.
 *
 * - Todo se revalida y se normaliza acá (`parseInquiry`): lo que llega es
 *   dato del cliente. Al backend va SOLO el body del contrato, armado campo
 *   por campo (su DTO rechaza campos de más).
 * - No es idempotente: dos POST iguales crean dos consultas. El form evita
 *   el doble envío.
 * - `error` siempre es un texto propio en español: el `message` del backend
 *   (en inglés, y a veces con el valor rechazado) no se reenvía ni se loguea.
 *   `field` es el campo del form al que se le atribuye, si se pudo.
 * - Datos personales (CUIT, sexo, edad, email, WhatsApp): el body NO se
 *   loguea ni se manda a analytics. A PostHog va `quote_submitted` con
 *   `tab` y `placement`; a Meta, el WhatsApp hasheado, igual que Taller.
 */
export async function POST(req: NextRequest) {
  const raw: unknown = await req.json().catch(() => null);

  const parsed = parseInquiry(raw);
  if (!parsed.ok) {
    return failure({ error: parsed.error, ...(parsed.field ? { field: parsed.field } : {}) }, 400);
  }

  let apiUrl: string;
  try {
    apiUrl = apiBaseUrl();
  } catch {
    return failure({ error: errors.unavailable }, 503);
  }

  try {
    const response = await fetch(`${apiUrl}/api/v1/inquiries/${parsed.kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.body),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Rate limit del backend (60/min por IP): se propaga con mensaje propio.
      if (response.status === 429) return failure({ error: errors.rateLimited }, 429);
      if (response.status >= 500) return failure({ error: errors.generic }, 502);
      // 400 del DTO (`message: string[]`) o de dominio (`message: string`).
      return failure(inquiryRejection(parsed.tab, data?.message), 400);
    }

    const id = typeof data?.id === "string" ? data.id : undefined;
    const publicCode =
      typeof data?.publicCode === "string" && data.publicCode.trim() !== ""
        ? data.publicCode.trim().replace(/^#+/, "")
        : null;

    // ── Medición: SOLO con la consulta ya registrada, y con `after()` para
    // no demorar la respuesta (mismo patrón que `/api/presupuesto`). ──
    const extra = (raw ?? {}) as Record<string, unknown>;
    const placement = placementOrNull(extra.placement);
    // `quote_submitted` sin datos del form: pestaña, ubicación y, como el
    // WhatsApp que reemplaza, `lead_source` solo en `/pedido`.
    const properties: AnalyticsProps = {
      flow: QUOTE_FLOWS.page,
      tab: parsed.tab,
      ...(placement ? { placement } : {}),
      ...(placement === QUOTE_MODULE_PLACEMENTS.pedido ? { lead_source: LEAD_SOURCES.form } : {}),
    };
    const posthogEvent = {
      event: ANALYTICS_EVENTS.quoteSubmitted,
      distinctId: posthogIdOrNull(extra.posthogDistinctId),
      sessionId: posthogIdOrNull(extra.posthogSessionId),
      properties,
    };
    after(() => capturePostHogServerEvent(posthogEvent));

    // Conversions API: el mismo evento que manda el Pixel del navegador
    // (`Lead` en `/pedido`, `Contact` en el Home: lo decide el catálogo), con
    // su `eventID` para deduplicar. Sin ubicación o sin ID no se manda.
    const metaEventId =
      typeof extra.metaEventId === "string" && META_EVENT_ID_PATTERN.test(extra.metaEventId)
        ? extra.metaEventId
        : null;
    const metaEvent = placement ? ANALYTICS_CATALOG.quote_submitted.meta(properties) : null;
    if (metaEventId && metaEvent) {
      const capiEvent = {
        eventName: metaEvent.name,
        eventId: metaEventId,
        eventSourceUrl: req.headers.get("referer") || `${siteConfig.url}/pedido`,
        clientIp: clientIpFrom(req),
        userAgent: req.headers.get("user-agent") || undefined,
        fbp: req.cookies.get("_fbp")?.value,
        fbc: req.cookies.get("_fbc")?.value,
        // Se hashea en `sendMetaCapiEvent`: a Meta solo llega el SHA-256.
        phone: parsed.body.contactPhone,
      };
      after(() => sendMetaCapiEvent(capiEvent));
    }

    return NextResponse.json({ success: true, id, publicCode });
  } catch (error) {
    // Solo el tipo del error: nunca el body ni nada que lo contenga.
    console.error(
      "[consulta] error al llamar al backend:",
      error instanceof Error ? error.name : "desconocido",
    );
    return failure({ error: errors.generic }, 502);
  }
}
