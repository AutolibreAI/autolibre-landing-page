import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildRedeemBody,
  CLAIM_CODE_MAX_LENGTH,
  parseMemberships,
  parseRedeemResponse,
  pickPartnerName,
  validateCode,
} from "../../lib/partner-claims/redeem.ts";

describe("validateCode", () => {
  it("recorta los espacios de los bordes y nada más", () => {
    assert.deepEqual(validateCode("  ab12-cd34 "), { ok: true, code: "ab12-cd34" });
  });

  it("no toca mayúsculas, guiones ni espacios internos (los normaliza el backend)", () => {
    assert.deepEqual(validateCode("Ab12 - CD34"), { ok: true, code: "Ab12 - CD34" });
  });

  it("vacío o solo espacios: empty", () => {
    assert.deepEqual(validateCode(""), { ok: false, reason: "empty" });
    assert.deepEqual(validateCode("   \t"), { ok: false, reason: "empty" });
  });

  it("acepta 1 y 32 caracteres; rechaza 33", () => {
    assert.equal(validateCode("a").ok, true);
    assert.equal(validateCode("a".repeat(CLAIM_CODE_MAX_LENGTH)).ok, true);
    assert.deepEqual(validateCode("a".repeat(CLAIM_CODE_MAX_LENGTH + 1)), {
      ok: false,
      reason: "too-long",
    });
  });

  it("el largo se mide después del trim", () => {
    assert.equal(validateCode(`  ${"a".repeat(CLAIM_CODE_MAX_LENGTH)}  `).ok, true);
  });
});

describe("buildRedeemBody", () => {
  it("manda solo { code }", () => {
    assert.deepEqual(JSON.parse(buildRedeemBody("AB12CD34")), { code: "AB12CD34" });
  });
});

describe("parseRedeemResponse", () => {
  const partnerId = "6b1f3c2e-0000-4000-8000-000000000001";

  it("201 con partnerId: success", () => {
    assert.deepEqual(
      parseRedeemResponse({ status: 201, body: { partnerId, role: "owner" }, requestId: "r1" }),
      { kind: "success", partnerId, role: "owner" },
    );
  });

  it("201 sin partnerId o con JSON inválido: unknown", () => {
    assert.equal(parseRedeemResponse({ status: 201, body: {}, requestId: null }).kind, "unknown");
    assert.equal(parseRedeemResponse({ status: 201, body: null, requestId: null }).kind, "unknown");
  });

  it("404 con el body uniforme del contrato: invalid-code", () => {
    const body = { statusCode: 404, message: "Claim code not found", code: "NOT_FOUND" };
    assert.equal(parseRedeemResponse({ status: 404, body, requestId: null }).kind, "invalid-code");
  });

  it("404 con otro body (ruta inexistente, URL mal configurada): unknown, no invalid-code", () => {
    for (const body of [
      { statusCode: 404, message: "Cannot POST /api/v1/partner-claim/redemptions", error: "Not Found" },
      { statusCode: 404, message: "Not Found", code: "NOT_FOUND" },
      { message: "Claim code not found" },
      null,
      "texto",
    ]) {
      assert.equal(parseRedeemResponse({ status: 404, body, requestId: null }).kind, "unknown");
    }
  });

  it("400, 401 y 429 tienen cada uno su resultado", () => {
    assert.equal(parseRedeemResponse({ status: 400, body: null, requestId: null }).kind, "invalid-input");
    assert.equal(parseRedeemResponse({ status: 401, body: null, requestId: null }).kind, "unauthenticated");
    assert.equal(parseRedeemResponse({ status: 429, body: null, requestId: null }).kind, "rate-limited");
  });

  it("5xx y status inesperados: unknown", () => {
    for (const status of [500, 502, 503, 200, 403, 409]) {
      assert.equal(parseRedeemResponse({ status, body: null, requestId: null }).kind, "unknown", String(status));
    }
  });

  it("los rechazos llevan el x-request-id si vino", () => {
    assert.deepEqual(
      parseRedeemResponse({
        status: 404,
        body: { statusCode: 404, message: "Claim code not found", code: "NOT_FOUND" },
        requestId: "req-123",
      }),
      {
      kind: "invalid-code",
      requestId: "req-123",
    });
    assert.deepEqual(parseRedeemResponse({ status: 500, body: null, requestId: null }), { kind: "unknown" });
  });
});

describe("membresías y nombre del taller", () => {
  const body = [
    { partnerId: "p-viejo", name: "Taller Viejo", role: "owner", since: "2026-01-01T00:00:00Z" },
    { partnerId: "p-nuevo", name: "  Frenos Pérez  ", role: "owner", since: "2026-11-03T00:00:00Z" },
    { partnerId: 42, name: "roto" },
    "basura",
  ];

  it("descarta lo que no tiene forma de membresía", () => {
    assert.equal(parseMemberships(body).length, 2);
    assert.deepEqual(parseMemberships(null), []);
    assert.deepEqual(parseMemberships({ data: [] }), []);
  });

  it("elige el taller del canje, no otro que ya administraba", () => {
    assert.equal(pickPartnerName(parseMemberships(body), "p-nuevo"), "Frenos Pérez");
  });

  it("sin la membresía o sin nombre: null (éxito sin nombre)", () => {
    assert.equal(pickPartnerName(parseMemberships(body), "p-otro"), null);
    assert.equal(
      pickPartnerName([{ partnerId: "p", name: "   ", role: "owner", since: "" }], "p"),
      null,
    );
  });
});
