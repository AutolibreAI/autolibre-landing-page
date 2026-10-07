import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BUSINESS_TYPE_BY_CATEGORY,
  businessTypeFor,
} from "../../../lib/provider-profile/business-type.ts";
import catalog from "../fixtures/service-categories.json" with { type: "json" };

test("cada familia del catálogo está mapeada a un tipo", () => {
  for (const category of catalog.categories) {
    assert.ok(
      category.slug in BUSINESS_TYPE_BY_CATEGORY,
      `La familia "${category.slug}" no está en BUSINESS_TYPE_BY_CATEGORY`,
    );
  }
});

test("el mapa no tiene claves que el catálogo no conoce", () => {
  const known = new Set(catalog.categories.map((category) => category.slug));
  for (const slug of Object.keys(BUSINESS_TYPE_BY_CATEGORY)) {
    assert.ok(known.has(slug), `"${slug}" está en el mapa pero no en el catálogo`);
  }
});

test("tipos por rubro", () => {
  assert.equal(businessTypeFor("motor"), "AutoRepair");
  assert.equal(businessTypeFor("neumaticos-y-llantas"), "TireShop");
  assert.equal(businessTypeFor("estetica"), "AutoWash");
  assert.equal(businessTypeFor("carroceria-y-cristales"), "AutoBodyShop");
  assert.equal(businessTypeFor("repuestos-e-insumos"), "AutoPartsStore");
});

test("un slug desconocido o ausente es AutomotiveBusiness", () => {
  assert.equal(businessTypeFor("rubro-nuevo"), "AutomotiveBusiness");
  assert.equal(businessTypeFor(null), "AutomotiveBusiness");
  assert.equal(businessTypeFor(undefined), "AutomotiveBusiness");
});
