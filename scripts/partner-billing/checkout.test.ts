import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCheckoutBody,
  findPlan,
  formatDate,
  formatPlanPrice,
  LANDING_PLAN_ID_TO_CODE,
  ownerMemberships,
  parseCheckoutResponse,
  parsePlanParam,
  parsePlans,
  parseTerms,
  termsParagraphs,
  validatePayerEmail,
} from "../../lib/partner-billing/checkout.ts";

describe("parsePlanParam", () => {
  it("acepta los planes pagos", () => {
    assert.equal(parsePlanParam("plus"), "plus");
    assert.equal(parsePlanParam("plus_max"), "plus_max");
  });

  it("tolera espacios y mayúsculas", () => {
    assert.equal(parsePlanParam("  PLUS_MAX "), "plus_max");
  });

  it("con el parámetro repetido vale el primero", () => {
    assert.equal(parsePlanParam(["plus", "plus_max"]), "plus");
  });

  it("free, vacío, ausente o desconocido ⇒ null", () => {
    for (const raw of ["free", "", "plan-plus", "premium", undefined, []]) {
      assert.equal(parsePlanParam(raw), null, String(raw));
    }
  });
});

describe("LANDING_PLAN_ID_TO_CODE", () => {
  it("mapea los ids de la landing a los codes del backend", () => {
    assert.deepEqual(LANDING_PLAN_ID_TO_CODE, { "plan-plus": "plus", "plan-plus-max": "plus_max" });
  });
});

describe("parsePlans / findPlan", () => {
  const body = [
    { code: "free", name: "Gratis", priceAmount: 0, currency: "ARS", priceIncludesVat: false, trialDays: 0 },
    { code: "plus", name: "Plus", priceAmount: 20000, currency: "ARS", priceIncludesVat: false, trialDays: 30 },
    { code: "roto", priceAmount: "20000", currency: "ARS" },
    null,
  ];

  it("descarta lo que no tiene forma de plan", () => {
    const plans = parsePlans(body);
    assert.deepEqual(
      plans.map((plan) => plan.code),
      ["free", "plus"],
    );
  });

  it("no es un array ⇒ lista vacía", () => {
    assert.deepEqual(parsePlans({ plans: [] }), []);
    assert.deepEqual(parsePlans(null), []);
  });

  it("trialDays inválido ⇒ 0; priceIncludesVat solo con true", () => {
    const [plan] = parsePlans([{ code: "plus", priceAmount: 1, currency: "ARS", trialDays: -3, priceIncludesVat: "sí" }]);
    assert.equal(plan?.trialDays, 0);
    assert.equal(plan?.priceIncludesVat, false);
  });

  it("encuentra por code", () => {
    const plans = parsePlans(body);
    assert.equal(findPlan(plans, "plus")?.priceAmount, 20000);
    assert.equal(findPlan(plans, "plus_max"), null);
  });
});

describe("formatPlanPrice", () => {
  it("formato de la página de planes", () => {
    assert.equal(formatPlanPrice({ priceAmount: 20000, currency: "ARS" }), "ARS 20.000");
    assert.equal(formatPlanPrice({ priceAmount: 30000, currency: "ARS" }), "ARS 30.000");
  });

  it("con decimales, hasta dos", () => {
    assert.equal(formatPlanPrice({ priceAmount: 19999.5, currency: "ARS" }), "ARS 19.999,5");
  });

  it("moneda inválida ⇒ fallback sin tirar", () => {
    assert.equal(formatPlanPrice({ priceAmount: 10, currency: "no-es-moneda" }), "no-es-moneda 10");
  });
});

describe("formatDate", () => {
  it("fecha larga en la zona de Argentina", () => {
    // 03:00 UTC del 5 = 00:00 del 5 en Buenos Aires.
    assert.equal(formatDate("2026-12-05T03:00:00.000Z"), "5 de diciembre de 2026");
    // 02:00 UTC del 5 = 23:00 del 4 en Buenos Aires.
    assert.equal(formatDate("2026-12-05T02:00:00.000Z"), "4 de diciembre de 2026");
  });

  it("vacío o inválido ⇒ null", () => {
    assert.equal(formatDate(null), null);
    assert.equal(formatDate(""), null);
    assert.equal(formatDate("mañana"), null);
  });
});

describe("validatePayerEmail", () => {
  it("recorta y acepta un email con forma válida", () => {
    assert.deepEqual(validatePayerEmail("  pagos@taller.com "), { ok: true, email: "pagos@taller.com" });
  });

  it("vacío", () => {
    assert.deepEqual(validatePayerEmail("   "), { ok: false, reason: "empty" });
  });

  it("sin forma de email o demasiado largo", () => {
    for (const raw of ["pagos", "pagos@taller", "pa gos@taller.com", "@taller.com", `${"a".repeat(250)}@x.com`]) {
      assert.deepEqual(validatePayerEmail(raw), { ok: false, reason: "invalid" }, raw);
    }
  });
});

describe("buildCheckoutBody", () => {
  it("exactamente plan, versión de términos y email: nunca un monto", () => {
    const body = JSON.parse(
      buildCheckoutBody({ planCode: "plus", termsVersion: "2026-11-draft", payerEmail: "pagos@taller.com" }),
    );
    assert.deepEqual(body, { planCode: "plus", termsVersion: "2026-11-draft", payerEmail: "pagos@taller.com" });
  });
});

describe("parseCheckoutResponse", () => {
  const ok = {
    subscriptionId: "sub-1",
    status: "pending",
    initPointUrl: "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=1",
  };
  const error = (statusCode: number, code: string, extra: Record<string, unknown> = {}) => ({
    ...extra,
    statusCode,
    message: "x",
    code,
  });

  it("201 con link https ⇒ success", () => {
    assert.deepEqual(parseCheckoutResponse({ status: 201, body: ok, requestId: null }), {
      kind: "success",
      subscriptionId: "sub-1",
      initPointUrl: ok.initPointUrl,
    });
  });

  it("201 sin subscriptionId o con link que no es https ⇒ unknown", () => {
    assert.equal(parseCheckoutResponse({ status: 201, body: { ...ok, subscriptionId: "" }, requestId: null }).kind, "unknown");
    for (const initPointUrl of ["http://mp.com/x", "javascript:alert(1)", "/relativo", 42]) {
      assert.equal(
        parseCheckoutResponse({ status: 201, body: { ...ok, initPointUrl }, requestId: null }).kind,
        "unknown",
        String(initPointUrl),
      );
    }
  });

  it("400: email rechazado por MP vs validación genérica", () => {
    assert.equal(
      parseCheckoutResponse({ status: 400, body: error(400, "PAYER_EMAIL_REJECTED"), requestId: null }).kind,
      "payer-email-rejected",
    );
    assert.equal(
      parseCheckoutResponse({ status: 400, body: error(400, "VALIDATION_ERROR"), requestId: null }).kind,
      "invalid-input",
    );
    assert.equal(parseCheckoutResponse({ status: 400, body: null, requestId: null }).kind, "invalid-input");
  });

  it("401 ⇒ unauthenticated", () => {
    assert.equal(parseCheckoutResponse({ status: 401, body: null, requestId: null }).kind, "unauthenticated");
  });

  it("403: solo FEATURE_DISABLED es disabled", () => {
    assert.equal(
      parseCheckoutResponse({ status: 403, body: error(403, "FEATURE_DISABLED"), requestId: null }).kind,
      "disabled",
    );
    assert.equal(parseCheckoutResponse({ status: 403, body: error(403, "FORBIDDEN"), requestId: null }).kind, "unknown");
  });

  it("404: solo el uniforme (NOT_FOUND) es not-found; una ruta inexistente es unknown", () => {
    assert.equal(
      parseCheckoutResponse({ status: 404, body: error(404, "NOT_FOUND"), requestId: null }).kind,
      "not-found",
    );
    assert.equal(
      parseCheckoutResponse({
        status: 404,
        body: { statusCode: 404, message: "Cannot POST /x", error: "Not Found" },
        requestId: null,
      }).kind,
      "unknown",
    );
  });

  it("409 por code", () => {
    assert.equal(
      parseCheckoutResponse({ status: 409, body: error(409, "TERMS_VERSION_OUTDATED"), requestId: null }).kind,
      "terms-outdated",
    );
    assert.equal(
      parseCheckoutResponse({ status: 409, body: error(409, "CHECKOUT_IN_PROGRESS"), requestId: null }).kind,
      "in-progress",
    );
    assert.equal(parseCheckoutResponse({ status: 409, body: error(409, "CONFLICT"), requestId: null }).kind, "unknown");
    assert.equal(parseCheckoutResponse({ status: 409, body: null, requestId: null }).kind, "unknown");
  });

  it("409 SUBSCRIPTION_ALREADY_LIVE con accessUntil arriba (forma real del filtro)", () => {
    assert.deepEqual(
      parseCheckoutResponse({
        status: 409,
        body: error(409, "SUBSCRIPTION_ALREADY_LIVE", { accessUntil: "2026-12-05T03:00:00.000Z" }),
        requestId: "req-1",
      }),
      { kind: "already-live", accessUntil: "2026-12-05T03:00:00.000Z", requestId: "req-1" },
    );
  });

  it("409 SUBSCRIPTION_ALREADY_LIVE con accessUntil en details (forma del contrato) o sin fecha", () => {
    const nested = parseCheckoutResponse({
      status: 409,
      body: error(409, "SUBSCRIPTION_ALREADY_LIVE", { details: { accessUntil: "2026-12-05T03:00:00.000Z" } }),
      requestId: null,
    });
    assert.deepEqual(nested, { kind: "already-live", accessUntil: "2026-12-05T03:00:00.000Z" });
    const none = parseCheckoutResponse({
      status: 409,
      body: error(409, "SUBSCRIPTION_ALREADY_LIVE", { accessUntil: null }),
      requestId: null,
    });
    assert.deepEqual(none, { kind: "already-live", accessUntil: null });
  });

  it("429, 503 y el resto", () => {
    assert.equal(parseCheckoutResponse({ status: 429, body: null, requestId: null }).kind, "rate-limited");
    assert.equal(parseCheckoutResponse({ status: 503, body: null, requestId: null }).kind, "unavailable");
    assert.equal(parseCheckoutResponse({ status: 500, body: null, requestId: null }).kind, "unknown");
  });

  it("guarda el x-request-id en los rechazos", () => {
    assert.deepEqual(parseCheckoutResponse({ status: 503, body: null, requestId: "abc" }), {
      kind: "unavailable",
      requestId: "abc",
    });
  });
});

describe("ownerMemberships", () => {
  it("solo los talleres con rol owner, en el orden del backend", () => {
    const memberships = [
      { partnerId: "a", name: "A", role: "owner" },
      { partnerId: "b", name: "B", role: "admin" },
      { partnerId: "c", name: "C", role: "owner" },
    ];
    assert.deepEqual(
      ownerMemberships(memberships).map((membership) => membership.partnerId),
      ["a", "c"],
    );
  });
});

describe("parseTerms / termsParagraphs", () => {
  it("versión y texto del backend", () => {
    assert.deepEqual(parseTerms({ version: "2026-11-draft", text: "Uno.\n\nDos." }), {
      version: "2026-11-draft",
      text: "Uno.\n\nDos.",
    });
  });

  it("sin forma ⇒ null", () => {
    for (const body of [null, [], { version: "", text: "x" }, { version: "v", text: "  " }, { version: 1, text: "x" }]) {
      assert.equal(parseTerms(body), null, JSON.stringify(body));
    }
  });

  it("párrafos separados por línea en blanco (con CRLF y espacios)", () => {
    assert.deepEqual(termsParagraphs("Uno\nsigue.\r\n\r\nDos.\n  \n\nTres. "), ["Uno\nsigue.", "Dos.", "Tres."]);
    assert.deepEqual(termsParagraphs("   "), []);
  });
});
