import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutHref, claimWithReturnHref, safeContinuePath, withReturnHref } from "../../lib/partner-billing/return-path.ts";

const PREFIX = "/proveedores/contratar";

describe("safeContinuePath", () => {
  it("acepta la contratación con su query", () => {
    assert.equal(safeContinuePath("/proveedores/contratar?plan=plus", PREFIX), "/proveedores/contratar?plan=plus");
    assert.equal(safeContinuePath("/proveedores/contratar", PREFIX), "/proveedores/contratar");
    assert.equal(safeContinuePath("/proveedores/contratar/resultado", PREFIX), "/proveedores/contratar/resultado");
  });

  it("descarta el hash y usa el primer valor si viene repetido", () => {
    assert.equal(safeContinuePath("/proveedores/contratar?plan=plus#x", PREFIX), "/proveedores/contratar?plan=plus");
    assert.equal(
      safeContinuePath(["/proveedores/contratar?plan=plus_max", "//evil.com"], PREFIX),
      "/proveedores/contratar?plan=plus_max",
    );
  });

  it("rechaza URLs absolutas y protocol-relative", () => {
    for (const raw of [
      "https://evil.com/proveedores/contratar",
      "//evil.com/proveedores/contratar",
      "///evil.com",
      "javascript:alert(1)",
      "proveedores/contratar",
    ]) {
      assert.equal(safeContinuePath(raw, PREFIX), null, raw);
    }
  });

  it("rechaza barras invertidas y caracteres de control", () => {
    for (const raw of ["/\\evil.com", "/proveedores/contratar\\..\\x", "/proveedores/contratar\n", "/\tproveedores/contratar"]) {
      assert.equal(safeContinuePath(raw, PREFIX), null, JSON.stringify(raw));
    }
  });

  it("rechaza rutas que salen del prefijo al normalizar o que solo lo comparten como texto", () => {
    for (const raw of [
      "/proveedores/contratar/../../evil",
      "/proveedores/contratar/%2e%2e/%2e%2e/evil",
      "/proveedores/contratarX",
      "/proveedores/reclamar",
      "/",
    ]) {
      assert.equal(safeContinuePath(raw, PREFIX), null, raw);
    }
  });

  it("vacío, ausente o demasiado largo ⇒ null", () => {
    assert.equal(safeContinuePath(undefined, PREFIX), null);
    assert.equal(safeContinuePath("", PREFIX), null);
    assert.equal(safeContinuePath([], PREFIX), null);
    assert.equal(safeContinuePath(`${PREFIX}?plan=${"a".repeat(600)}`, PREFIX), null);
  });
});

describe("hrefs", () => {
  it("checkoutHref", () => {
    assert.equal(checkoutHref(PREFIX, "plus_max"), "/proveedores/contratar?plan=plus_max");
  });

  it("claimWithReturnHref codifica el next y vuelve a pasar el filtro", () => {
    const href = claimWithReturnHref("/proveedores/reclamar", checkoutHref(PREFIX, "plus"));
    assert.equal(href, "/proveedores/reclamar?next=%2Fproveedores%2Fcontratar%3Fplan%3Dplus");
    const next = new URL(href, "https://x.test").searchParams.get("next") ?? undefined;
    assert.equal(safeContinuePath(next, PREFIX), "/proveedores/contratar?plan=plus");
  });

  it("withReturnHref lleva el next al alta y vuelve a pasar el filtro", () => {
    const href = withReturnHref("/proveedores/registro", checkoutHref(PREFIX, "plus_max"));
    assert.equal(href, "/proveedores/registro?next=%2Fproveedores%2Fcontratar%3Fplan%3Dplus_max");
    const next = new URL(href, "https://x.test").searchParams.get("next") ?? undefined;
    assert.equal(safeContinuePath(next, PREFIX), "/proveedores/contratar?plan=plus_max");
  });
});
