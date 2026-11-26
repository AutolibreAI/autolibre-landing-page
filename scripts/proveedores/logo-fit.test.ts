import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PROVIDER_LOGO_MAX_SIDE,
  PROVIDER_LOGO_SOURCE_MAX_BYTES,
  fitProviderLogo,
  validProviderLogoSource,
} from "../../lib/proveedores/registration.ts";

describe("fitProviderLogo", () => {
  it("no agranda una imagen que ya entra", () => {
    assert.deepEqual(fitProviderLogo(300, 200), { width: 300, height: 200 });
  });
  it("deja intacta una imagen justo en el limite", () => {
    assert.deepEqual(
      fitProviderLogo(PROVIDER_LOGO_MAX_SIDE, PROVIDER_LOGO_MAX_SIDE),
      { width: PROVIDER_LOGO_MAX_SIDE, height: PROVIDER_LOGO_MAX_SIDE },
    );
  });
  it("achica por el lado mas largo manteniendo la proporcion", () => {
    assert.deepEqual(fitProviderLogo(4000, 3000), { width: 512, height: 384 });
    assert.deepEqual(fitProviderLogo(1000, 2000), { width: 256, height: 512 });
  });
  it("nunca devuelve un lado de 0 px en imagenes muy alargadas", () => {
    assert.deepEqual(fitProviderLogo(10000, 5), { width: 512, height: 1 });
  });
});

describe("validProviderLogoSource", () => {
  it("acepta PNG, JPEG y WebP de varios MB, porque se comprimen antes de enviar", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      assert.equal(
        validProviderLogoSource({ type, size: 4 * 1024 * 1024 }),
        true,
        type,
      );
    }
  });
  it("acepta hasta el tope del original inclusive", () => {
    assert.equal(
      validProviderLogoSource({
        type: "image/jpeg",
        size: PROVIDER_LOGO_SOURCE_MAX_BYTES,
      }),
      true,
    );
  });
  it("rechaza vacios, originales enormes y otros formatos", () => {
    assert.equal(validProviderLogoSource({ type: "image/png", size: 0 }), false);
    assert.equal(
      validProviderLogoSource({
        type: "image/png",
        size: PROVIDER_LOGO_SOURCE_MAX_BYTES + 1,
      }),
      false,
    );
    assert.equal(
      validProviderLogoSource({ type: "image/svg+xml", size: 100 }),
      false,
    );
    assert.equal(
      validProviderLogoSource({ type: "image/heic", size: 100 }),
      false,
    );
  });
});
