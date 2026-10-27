import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PROVIDER_LOGO_MAX_BYTES,
  validBrandSelection,
  validProviderLogo,
  parseProviderProfileFields,
  appendProviderBrand,
} from "../../lib/proveedores/registration.ts";

describe("registro de proveedores", () => {
  it("permite marcas libres sin repetirlas por mayusculas o espacios", () => {
    assert.deepEqual(appendProviderBrand(["Ford"], "  ford  "), ["Ford"]);
    assert.deepEqual(appendProviderBrand(["Ford"], "  Nueva   Marca "), ["Ford", "Nueva Marca"]);
    assert.deepEqual(appendProviderBrand([], " "), []);
    assert.deepEqual(appendProviderBrand([], "a".repeat(101)), []);
  });
  it("la descripcion acepta 90 caracteres y rechaza 91", () => {
    assert.deepEqual(
      parseProviderProfileFields("  " + "a".repeat(90) + "  ", undefined),
      { ok: true, description: "a".repeat(90) },
    );
    assert.deepEqual(parseProviderProfileFields("a".repeat(91), undefined), {
      ok: false,
      kind: "description",
    });
    assert.equal(parseProviderProfileFields(123, undefined).ok, false);
  });
  it("descripcion y redes pueden quedar vacias", () => {
    assert.deepEqual(parseProviderProfileFields("  ", { instagram: "" }), {
      ok: true,
    });
    assert.deepEqual(parseProviderProfileFields(undefined, undefined), {
      ok: true,
    });
  });
  it("normaliza los links y admite solo protocolos navegables", () => {
    assert.deepEqual(
      parseProviderProfileFields(undefined, {
        instagram: " https://instagram.com/negocio ",
        facebook: "",
      }),
      { ok: true, socialLinks: { instagram: "https://instagram.com/negocio" } },
    );
    for (const instagram of [
      "javascript:alert(1)",
      "ftp://example.com",
      "@negocio",
      "https://user:pass@example.com",
    ]) {
      assert.deepEqual(parseProviderProfileFields(undefined, { instagram }), {
        ok: false,
        kind: "socialLinks",
        network: "instagram",
      });
    }
  });
  it("rechaza redes desconocidas y valores mal formados", () => {
    for (const links of [
      [],
      null,
      "https://example.com",
      { other: "https://example.com" },
      { instagram: 1 },
    ]) {
      assert.equal(parseProviderProfileFields(undefined, links).ok, false);
    }
  });
  it("permite todas las marcas con especialidades o sin ellas", () => {
    assert.equal(validBrandSelection(true, [], ["Toyota"]), true);
    assert.equal(validBrandSelection(true, [], []), true);
  });
  it("exige marcas cuando se restringe la cobertura", () => {
    assert.equal(validBrandSelection(false, [], []), false);
    assert.equal(validBrandSelection(false, ["Toyota"], []), true);
  });
  it("las especialidades deben ser marcas atendidas", () => {
    assert.equal(validBrandSelection(false, ["Toyota"], ["Toyota"]), true);
    assert.equal(validBrandSelection(false, ["Toyota"], ["Ford"]), false);
  });
  it("acepta logos PNG, JPEG y WebP hasta el limite inclusive", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      assert.equal(
        validProviderLogo({ type, size: PROVIDER_LOGO_MAX_BYTES }),
        true,
      );
    }
  });
  it("rechaza archivos vacios, grandes y otros formatos", () => {
    assert.equal(validProviderLogo({ type: "image/png", size: 0 }), false);
    assert.equal(
      validProviderLogo({
        type: "image/png",
        size: PROVIDER_LOGO_MAX_BYTES + 1,
      }),
      false,
    );
    assert.equal(
      validProviderLogo({ type: "image/svg+xml", size: 100 }),
      false,
    );
    assert.equal(
      validProviderLogo({ type: "application/pdf", size: 100 }),
      false,
    );
  });
});
