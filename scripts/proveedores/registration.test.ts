import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PROVIDER_LOGO_MAX_BYTES,
  validBrandSelection,
  validProviderLogo,
} from "../../lib/proveedores/registration.ts";

describe("registro de proveedores", () => {
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
