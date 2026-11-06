import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canCancelSubscription,
  cancellationAccessDate,
  classifySubscription,
  hasActivePlan,
  trialNoteFor,
  parseCancellationResponse,
  parsePartnerIdParam,
  parsePendingCheckout,
  parseSubscriptionResponse,
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
  serializePendingCheckout,
  shouldKeepPolling,
  type SubscriptionView,
} from "../../lib/partner-billing/subscription.ts";

const PARTNER_ID = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed";

const view = (status: string | null): SubscriptionView => ({
  planCode: "plus",
  status,
  trialEndsAt: null,
  currentPeriodEnd: null,
  accessUntil: null,
  cancelAtPeriodEnd: false,
  trialEligible: null,
});

describe("parseSubscriptionResponse", () => {
  it("200 con la forma del contrato", () => {
    assert.deepEqual(
      parseSubscriptionResponse({
        status: 200,
        body: {
          planCode: "plus",
          status: "trialing",
          trialEndsAt: "2026-12-05T03:00:00.000Z",
          currentPeriodEnd: null,
          nextChargeAt: null,
          cancelAtPeriodEnd: false,
          accessUntil: null,
          scheduledPlanCode: null,
        },
        requestId: null,
      }),
      {
        kind: "ok",
        view: {
          planCode: "plus",
          status: "trialing",
          trialEndsAt: "2026-12-05T03:00:00.000Z",
          currentPeriodEnd: null,
          accessUntil: null,
          cancelAtPeriodEnd: false,
          trialEligible: null,
        },
      },
    );
  });

  it("200 Gratis (status null)", () => {
    const result = parseSubscriptionResponse({ status: 200, body: { planCode: "free", status: null }, requestId: null });
    assert.deepEqual(result, {
      kind: "ok",
      view: {
        planCode: "free",
        status: null,
        trialEndsAt: null,
        currentPeriodEnd: null,
        accessUntil: null,
        cancelAtPeriodEnd: false,
        trialEligible: null,
      },
    });
  });

  it("lee trialEligible y cancelAtPeriodEnd cuando vienen", () => {
    const result = parseSubscriptionResponse({
      status: 200,
      body: { planCode: "free", status: null, trialEligible: false, cancelAtPeriodEnd: true },
      requestId: null,
    });
    assert.equal(result.kind === "ok" && result.view.trialEligible, false);
    assert.equal(result.kind === "ok" && result.view.cancelAtPeriodEnd, true);
    const odd = parseSubscriptionResponse({ status: 200, body: { planCode: "free", status: null, trialEligible: "sí" }, requestId: null });
    assert.equal(odd.kind === "ok" && odd.view.trialEligible, null);
  });

  it("200 roto ⇒ unknown", () => {
    assert.equal(parseSubscriptionResponse({ status: 200, body: { status: "active" }, requestId: null }).kind, "unknown");
    assert.equal(
      parseSubscriptionResponse({ status: 200, body: { planCode: "plus", status: 3 }, requestId: null }).kind,
      "unknown",
    );
    assert.equal(parseSubscriptionResponse({ status: 200, body: null, requestId: null }).kind, "unknown");
  });

  it("401, 404 y el resto", () => {
    assert.equal(parseSubscriptionResponse({ status: 401, body: null, requestId: null }).kind, "unauthenticated");
    assert.equal(parseSubscriptionResponse({ status: 404, body: null, requestId: null }).kind, "not-found");
    assert.deepEqual(parseSubscriptionResponse({ status: 500, body: null, requestId: "r" }), {
      kind: "unknown",
      requestId: "r",
    });
  });
});

describe("classifySubscription", () => {
  it("solo active y trialing confirman", () => {
    assert.equal(classifySubscription(view("active")), "confirmed");
    assert.equal(classifySubscription(view("trialing")), "confirmed");
  });

  it("pending sigue pendiente", () => {
    assert.equal(classifySubscription(view("pending")), "pending");
  });

  it("null es Gratis", () => {
    assert.equal(classifySubscription(view(null)), "free");
  });

  it("paused o un estado desconocido NUNCA confirman", () => {
    for (const status of ["paused", "authorized", "approved", "ACTIVE", ""]) {
      assert.equal(classifySubscription(view(status)), "unconfirmed", status);
    }
  });
});

describe("shouldKeepPolling", () => {
  it("sigue mientras está pendiente y la próxima consulta entra en la ventana", () => {
    assert.equal(shouldKeepPolling("pending", 0), true);
    assert.equal(shouldKeepPolling("pending", POLL_TIMEOUT_MS - POLL_INTERVAL_MS), true);
  });

  it("corta al agotar la ventana", () => {
    assert.equal(shouldKeepPolling("pending", POLL_TIMEOUT_MS - POLL_INTERVAL_MS + 1), false);
  });

  it("corta con cualquier estado que no sea pendiente", () => {
    for (const classification of ["confirmed", "free", "unconfirmed"] as const) {
      assert.equal(shouldKeepPolling(classification, 0), false, classification);
    }
  });

  it("ventana del contrato: cada 2 s durante 30 s", () => {
    assert.equal(POLL_INTERVAL_MS, 2_000);
    assert.equal(POLL_TIMEOUT_MS, 30_000);
  });
});

describe("parsePendingCheckout", () => {
  it("ida y vuelta", () => {
    const checkout = { partnerId: PARTNER_ID, planCode: "plus", subscriptionId: "sub-1" };
    assert.deepEqual(parsePendingCheckout(serializePendingCheckout(checkout)), checkout);
  });

  it("nada, JSON inválido o sin forma ⇒ null", () => {
    for (const raw of [
      null,
      "",
      "{",
      "[]",
      JSON.stringify({ partnerId: "no-uuid", planCode: "plus", subscriptionId: "s" }),
      JSON.stringify({ partnerId: PARTNER_ID, planCode: "plus" }),
    ]) {
      assert.equal(parsePendingCheckout(raw), null, String(raw));
    }
  });
});

describe("parsePartnerIdParam", () => {
  it("acepta un UUID (y lo pasa a minúsculas)", () => {
    assert.equal(parsePartnerIdParam(PARTNER_ID.toUpperCase()), PARTNER_ID);
    assert.equal(parsePartnerIdParam([PARTNER_ID, "otro"]), PARTNER_ID);
  });

  it("cualquier otra cosa ⇒ null", () => {
    for (const raw of [undefined, "", "123", `${PARTNER_ID}x`, "../../etc"]) {
      assert.equal(parsePartnerIdParam(raw), null, String(raw));
    }
  });
});

describe("hasActivePlan", () => {
  it("solo un plan pago con estado confirmado", () => {
    assert.equal(hasActivePlan(view("active")), true);
    assert.equal(hasActivePlan(view("trialing")), true);
    for (const status of ["pending", "paused", null]) {
      assert.equal(hasActivePlan(view(status)), false, String(status));
    }
    assert.equal(hasActivePlan({ ...view("active"), planCode: "free" }), false);
  });
});

describe("trialNoteFor", () => {
  it("según trialEligible", () => {
    assert.equal(trialNoteFor(30, true), "eligible");
    assert.equal(trialNoteFor(30, false), "used");
    assert.equal(trialNoteFor(30, null), "conditional");
    assert.equal(trialNoteFor(30, undefined), "conditional");
  });

  it("sin días de prueba no se muestra nada", () => {
    assert.equal(trialNoteFor(0, true), "none");
  });
});

describe("canCancelSubscription", () => {
  it("plan pago confirmado y sin baja pedida", () => {
    assert.equal(canCancelSubscription(view("active")), true);
    assert.equal(canCancelSubscription(view("trialing")), true);
  });

  it("con la baja pedida, Gratis, pendiente o sin confirmar: no", () => {
    assert.equal(canCancelSubscription({ ...view("active"), cancelAtPeriodEnd: true }), false);
    assert.equal(canCancelSubscription({ ...view(null), planCode: "free" }), false);
    assert.equal(canCancelSubscription(view("pending")), false);
    assert.equal(canCancelSubscription(view("paused")), false);
  });
});

describe("cancellationAccessDate", () => {
  const dates = { trialEndsAt: "2026-12-05T03:00:00.000Z", currentPeriodEnd: "2026-12-20T03:00:00.000Z" };

  it("en prueba: el fin de la prueba", () => {
    assert.equal(cancellationAccessDate({ ...view("trialing"), ...dates }), dates.trialEndsAt);
  });

  it("activo: el fin del período pago", () => {
    assert.equal(cancellationAccessDate({ ...view("active"), ...dates }), dates.currentPeriodEnd);
  });

  it("sin el dato: null", () => {
    assert.equal(cancellationAccessDate(view("active")), null);
  });
});

describe("parseCancellationResponse", () => {
  it("200 con accessUntil", () => {
    assert.deepEqual(
      parseCancellationResponse({ status: 200, body: { accessUntil: "2026-12-05T03:00:00.000Z" }, requestId: null }),
      { kind: "success", accessUntil: "2026-12-05T03:00:00.000Z" },
    );
  });

  it("200 con accessUntil null (solo había un checkout pendiente) o body raro", () => {
    assert.deepEqual(parseCancellationResponse({ status: 200, body: { accessUntil: null }, requestId: null }), {
      kind: "success",
      accessUntil: null,
    });
    assert.deepEqual(parseCancellationResponse({ status: 200, body: null, requestId: null }), {
      kind: "success",
      accessUntil: null,
    });
  });

  it("401, 404 uniforme y 400", () => {
    assert.equal(parseCancellationResponse({ status: 401, body: null, requestId: null }).kind, "unauthenticated");
    assert.equal(parseCancellationResponse({ status: 404, body: null, requestId: "r1" }).kind, "not-found");
    assert.equal(parseCancellationResponse({ status: 400, body: null, requestId: null }).kind, "not-found");
  });

  it("503 y 500: reintentable, con requestId", () => {
    assert.deepEqual(parseCancellationResponse({ status: 503, body: { code: "SERVICE_UNAVAILABLE" }, requestId: "r2" }), {
      kind: "retryable",
      requestId: "r2",
    });
    assert.equal(parseCancellationResponse({ status: 500, body: null, requestId: null }).kind, "retryable");
  });
});
