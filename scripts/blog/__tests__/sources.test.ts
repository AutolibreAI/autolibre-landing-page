import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, it } from "node:test";
import { classifyStatus, daysBetween, defaultSourcesPath, loadSources } from "../lib/sources.ts";
import { loadSourcesFixture } from "./helpers.ts";

describe("sources", () => {
  const sources = loadSourcesFixture();

  it("parsea las entradas `### ID · título` y nada más", () => {
    assert.deepEqual([...sources.keys()], ["DOC-01", "DOC-02", "CED-02", "VTV-07", "LIC-09", "PAT-01"]);
    assert.equal(sources.get("DOC-02")!.title, "¿Qué documentos puedo llevar en el celular?");
  });

  it("clasifica el estado: confirmado, mixto, contradicción y a verificar", () => {
    assert.equal(sources.get("DOC-01")!.status, "mixed");
    assert.equal(sources.get("DOC-02")!.status, "confirmed");
    assert.equal(sources.get("VTV-07")!.status, "contradiction");
    assert.equal(sources.get("LIC-09")!.status, "pending");
    assert.equal(classifyStatus("✅ PBA · 🔍 CABA"), "mixed");
    assert.equal(classifyStatus("✅ Confirmado (con una página oficial desactualizada, ver detalle)"), "confirmed");
    assert.equal(classifyStatus("Confirmado"), "unknown");
  });

  it("parsea las fechas de Verificado (una o varias) a ISO", () => {
    assert.deepEqual(sources.get("DOC-01")!.verified, ["2026-09-27"]);
    assert.deepEqual(sources.get("CED-02")!.verified, ["2026-09-21", "2026-09-27"]);
    assert.deepEqual(sources.get("PAT-01")!.verified, ["2026-05-01"]);
  });

  it("daysBetween", () => {
    assert.equal(daysBetween("2026-09-01", "2026-09-30"), 29);
  });

  it(
    "la fuente de verdad real (si está disponible) parsea los estados",
    { skip: !existsSync(defaultSourcesPath()) },
    () => {
      const real = loadSources();
      assert.ok(real.size > 40);
      assert.equal(real.get("DOC-01")?.status, "mixed");
      assert.equal(real.get("CED-02")?.status, "confirmed");
      assert.equal(real.get("DOC-04")?.status, "contradiction");
    },
  );
});
