import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fitMapView, isGeoPoint, staticMapUrl } from "../../lib/proveedores/map.ts";

const OBELISCO = { latitude: -34.6037, longitude: -58.3816 };
const TIGRE = { latitude: -34.4261, longitude: -58.5797 };
const SAN_ISIDRO = { latitude: -34.4708, longitude: -58.5276 };

describe("isGeoPoint", () => {
  it("acepta coordenadas reales", () => {
    assert.equal(isGeoPoint(OBELISCO), true);
  });

  it("descarta null, fuera de rango, no finitos y el (0, 0) del geocoder", () => {
    assert.equal(isGeoPoint(null), false);
    assert.equal(isGeoPoint({ latitude: 91, longitude: 0 }), false);
    assert.equal(isGeoPoint({ latitude: Number.NaN, longitude: 1 }), false);
    assert.equal(isGeoPoint({ latitude: 0, longitude: 0 }), false);
  });
});

describe("fitMapView", () => {
  it("sin puntos no hay vista", () => {
    assert.equal(fitMapView([], { width: 640, height: 640 }), null);
  });

  it("un solo punto queda en el centro, con el zoom tope", () => {
    const view = fitMapView([OBELISCO], { width: 400, height: 260, maxZoom: 15 });
    assert.ok(view);
    assert.equal(view.zoom, 15);
    assert.deepEqual(view.positions, [{ x: 50, y: 50 }]);
    assert.ok(Math.abs(view.center.latitude - OBELISCO.latitude) < 1e-6);
    assert.ok(Math.abs(view.center.longitude - OBELISCO.longitude) < 1e-6);
  });

  it("todos los puntos entran dentro del margen pedido", () => {
    const view = fitMapView([OBELISCO, TIGRE, SAN_ISIDRO], {
      width: 640,
      height: 640,
      padding: 0.12,
    });
    assert.ok(view);
    for (const position of view.positions) {
      assert.ok(position.x >= 12 && position.x <= 88, `x fuera: ${position.x}`);
      assert.ok(position.y >= 12 && position.y <= 88, `y fuera: ${position.y}`);
    }
  });

  it("con algo tapando abajo, los puntos quedan en la zona libre", () => {
    const view = fitMapView([OBELISCO, TIGRE, SAN_ISIDRO], {
      width: 640,
      height: 640,
      padding: 0.1,
      insetBottom: 0.25,
    });
    assert.ok(view);
    for (const position of view.positions) {
      assert.ok(position.y >= 10 && position.y <= 65, `y fuera: ${position.y}`);
    }
  });

  it("el norte queda arriba y el oeste a la izquierda", () => {
    const view = fitMapView([OBELISCO, TIGRE], { width: 640, height: 640 });
    assert.ok(view);
    const [obelisco, tigre] = view.positions;
    // Tigre está al norte (más arriba = menor y) y al oeste (menor x).
    assert.ok(tigre.y < obelisco.y);
    assert.ok(tigre.x < obelisco.x);
  });

  it("puntos lejanos bajan el zoom, sin pasar del mínimo", () => {
    const cerca = fitMapView([OBELISCO, SAN_ISIDRO], { width: 640, height: 640 });
    const lejos = fitMapView([OBELISCO, { latitude: -54.8, longitude: -68.3 }], {
      width: 640,
      height: 640,
      minZoom: 3,
    });
    assert.ok(cerca && lejos);
    assert.ok(lejos.zoom < cerca.zoom);
    assert.ok(lejos.zoom >= 3);
  });
});

describe("staticMapUrl", () => {
  it("arma la URL sin marcadores, con escala 2 y la key codificada", () => {
    const url = staticMapUrl({ center: OBELISCO, zoom: 12, width: 640, height: 640, apiKey: "a b" });
    assert.ok(url.startsWith("https://maps.googleapis.com/maps/api/staticmap?"));
    assert.ok(url.includes("center=-34.603700,-58.381600"));
    assert.ok(url.includes("zoom=12"));
    assert.ok(url.includes("size=640x640"));
    assert.ok(url.includes("scale=2"));
    assert.ok(url.includes("key=a%20b"));
    assert.ok(!url.includes("markers="));
  });
});
