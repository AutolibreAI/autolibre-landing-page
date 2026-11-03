import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyPartnerApplicationBadRequest,
  describePartnerApplicationRejection,
} from "../../lib/autolibre-api.ts";

// El cartel que ve la persona es deliberadamente vago; el log del servidor no
// puede serlo. Sin esto, el motivo que mando el backend se perdia en la
// landing y nadie podia explicar por que un taller no se pudo anotar.
describe("log de un rechazo del alta de partner", () => {
  it("guarda el status y el motivo textual del backend", () => {
    assert.deepEqual(
      describePartnerApplicationRejection(400, {
        statusCode: 400,
        message: "Invalid application logo image",
        code: "VALIDATION_ERROR",
      }),
      {
        msg: "partner-application rejected by backend",
        status: 400,
        reason: "Invalid application logo image",
        code: "VALIDATION_ERROR",
      },
    );
  });

  it("une los mensajes de validacion de Nest (array) en un solo motivo", () => {
    assert.equal(
      describePartnerApplicationRejection(400, {
        message: ["email must be an email", "address must be a string"],
        error: "Bad Request",
      }).reason,
      "email must be an email; address must be a string",
    );
  });

  it("no inventa un motivo cuando el body no se pudo leer", () => {
    assert.deepEqual(describePartnerApplicationRejection(502, null), {
      msg: "partner-application rejected by backend",
      status: 502,
      reason: null,
      code: null,
    });
  });
});

// El 2026-11-03 un taller no se pudo anotar: el backend rechazaba el logo y
// la landing le mostraba "hay un campo con un formato que no podemos
// aceptar", sin decirle cual. Cada motivo que la persona puede corregir tiene
// que llegarle con nombre propio.
describe("clasificacion de un 400 del alta de partner", () => {
  it("un logo rechazado por el backend se reconoce como problema del logo", () => {
    for (const message of [
      "Invalid application logo",
      "Invalid application logo image",
      "Application logo exceeds 512 KB",
    ]) {
      assert.equal(
        classifyPartnerApplicationBadRequest({ message, code: "VALIDATION_ERROR" }),
        "invalid-logo",
        message,
      );
    }
  });

  it("un slug de rubro desconocido sigue siendo invalid-services", () => {
    assert.equal(
      classifyPartnerApplicationBadRequest({
        message: "Unknown service slugs: gomeria-x. Valid slugs are ...",
        code: "VALIDATION_ERROR",
      }),
      "invalid-services",
    );
  });

  it("cualquier otro motivo, o un body ilegible, cae en invalid", () => {
    for (const body of [
      { message: "Invalid business name: " },
      { message: ["email must be an email"], error: "Bad Request" },
      null,
      "texto",
    ]) {
      assert.equal(classifyPartnerApplicationBadRequest(body), "invalid");
    }
  });
});
