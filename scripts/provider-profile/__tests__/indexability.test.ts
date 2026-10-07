import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isIndexable,
  type IndexabilityInput,
} from "../../../lib/provider-profile/indexability.ts";

const complete: IndexabilityInput = {
  description: "Taller familiar de mecánica general.",
  services: [{ items: [{ slug: "service" }] }],
  businessHours: [{ ranges: [{ opensAt: "08:00", closesAt: "18:00" }] }],
  address: { full: "Av. Ejemplo 1234, San Isidro" },
  serviceArea: null,
};

test("es indexable con descripción, servicio, horarios y dirección", () => {
  assert.equal(isIndexable(complete), true);
});

test("es indexable con zona de cobertura en lugar de dirección", () => {
  assert.equal(
    isIndexable({
      ...complete,
      address: null,
      serviceArea: { localities: [{ name: "San Isidro" }] },
    }),
    true,
  );
});

test("no es indexable si falta cualquiera de los cuatro datos", () => {
  assert.equal(isIndexable({ ...complete, description: null }), false);
  assert.equal(isIndexable({ ...complete, description: "   " }), false);
  assert.equal(isIndexable({ ...complete, services: [] }), false);
  assert.equal(isIndexable({ ...complete, services: [{ items: [] }] }), false);
  assert.equal(isIndexable({ ...complete, businessHours: null }), false);
  assert.equal(isIndexable({ ...complete, businessHours: [{ ranges: [] }] }), false);
  assert.equal(isIndexable({ ...complete, address: null }), false);
});
