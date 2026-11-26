import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSignInHref,
  DEFAULT_SIGN_IN_DESTINATION,
  parseSafeRedirect,
  signInDestinationKind,
  signupIntentForDestination,
} from "../../lib/auth/sign-in-redirect.ts";

// Contrato de `/ingresar?redirect=` (2026-11-26): el parámetro solo acepta
// rutas relativas del mismo origen. Todo lo demás vuelve a `/cuenta`.

describe("parseSafeRedirect", () => {
  it("acepta rutas relativas con su query", () => {
    assert.equal(parseSafeRedirect("/cuenta"), "/cuenta");
    assert.equal(parseSafeRedirect("/cuenta?seccion=plan"), "/cuenta?seccion=plan");
    assert.equal(parseSafeRedirect("/proveedores/contratar?plan=plus"), "/proveedores/contratar?plan=plus");
    assert.equal(
      parseSafeRedirect("/proveedores/registro?next=%2Fproveedores%2Fcontratar%3Fplan%3Dplus&alta=1"),
      "/proveedores/registro?next=%2Fproveedores%2Fcontratar%3Fplan%3Dplus&alta=1",
    );
  });

  it("toma el primer valor si el parámetro viene repetido", () => {
    assert.equal(parseSafeRedirect(["/proveedores/reclamar", "https://evil.com"]), "/proveedores/reclamar");
  });

  it("cae en /cuenta sin valor", () => {
    for (const value of [undefined, null, "", []]) {
      assert.equal(parseSafeRedirect(value), DEFAULT_SIGN_IN_DESTINATION);
    }
  });

  it("rechaza URLs absolutas, esquemas y protocol-relative", () => {
    for (const value of [
      "https://evil.com",
      "http://evil.com/cuenta",
      "javascript:alert(1)",
      "data:text/html,hola",
      "//evil.com",
      "//evil.com/cuenta",
      "/\\evil.com",
      "\\\\evil.com",
      "cuenta",
      " /cuenta",
    ]) {
      assert.equal(parseSafeRedirect(value), DEFAULT_SIGN_IN_DESTINATION, value);
    }
  });

  it("rechaza caracteres de control y barras invertidas", () => {
    for (const value of ["/\t/evil.com", "/\n/evil.com", "/cuenta\r\n", "/a\\b", "/\u0000x", "/\u007fx"]) {
      assert.equal(parseSafeRedirect(value), DEFAULT_SIGN_IN_DESTINATION, JSON.stringify(value));
    }
  });

  it("rechaza rutas que normalizan a protocol-relative", () => {
    assert.equal(parseSafeRedirect("/.//evil.com"), DEFAULT_SIGN_IN_DESTINATION);
    assert.equal(parseSafeRedirect("/a/..//evil.com"), DEFAULT_SIGN_IN_DESTINATION);
  });

  it("no vuelve al propio /ingresar (bucle)", () => {
    for (const value of ["/ingresar", "/ingresar?redirect=/cuenta", "/ingresar/", "/x/../ingresar"]) {
      assert.equal(parseSafeRedirect(value), DEFAULT_SIGN_IN_DESTINATION, value);
    }
    assert.equal(parseSafeRedirect("/ingresarx"), "/ingresarx");
  });

  it("normaliza la ruta y descarta el fragmento", () => {
    assert.equal(parseSafeRedirect("/proveedores/../cuenta"), "/cuenta");
    assert.equal(parseSafeRedirect("/cuenta#/sso-callback"), "/cuenta");
  });

  it("rechaza valores larguísimos", () => {
    assert.equal(parseSafeRedirect(`/cuenta?x=${"a".repeat(3000)}`), DEFAULT_SIGN_IN_DESTINATION);
  });
});

describe("buildSignInHref", () => {
  it("codifica el destino entero en ?redirect=", () => {
    assert.equal(buildSignInHref("/cuenta"), "/ingresar?redirect=%2Fcuenta");
    assert.equal(
      buildSignInHref("/proveedores/contratar?plan=plus"),
      "/ingresar?redirect=%2Fproveedores%2Fcontratar%3Fplan%3Dplus",
    );
  });

  it("ida y vuelta: lo que arma lo lee igual", () => {
    const destination = "/proveedores/registro?next=%2Fproveedores%2Fcontratar%3Fplan%3Dplus&alta=1";
    const href = buildSignInHref(destination);
    const param = new URL(href, "https://autolibre.invalid").searchParams.get("redirect");
    assert.equal(parseSafeRedirect(param), destination);
  });

  it("un destino inválido arma el link a /cuenta", () => {
    assert.equal(buildSignInHref("https://evil.com"), "/ingresar?redirect=%2Fcuenta");
  });
});

describe("signupIntentForDestination", () => {
  it("los flujos de proveedor crean cuentas de negocio sin preguntar", () => {
    assert.equal(signupIntentForDestination("/proveedores/registro?alta=1"), "partner");
    assert.equal(signupIntentForDestination("/proveedores/contratar?plan=plus"), "partner");
    assert.equal(signupIntentForDestination("/proveedores/reclamar"), "partner");
  });

  it("/cuenta (y cualquier otro destino) pregunta", () => {
    assert.equal(signupIntentForDestination("/cuenta"), "ask");
    assert.equal(signupIntentForDestination("/cuenta?seccion=plan"), "ask");
    assert.equal(signupIntentForDestination("/pedido"), "ask");
    assert.equal(signupIntentForDestination("/proveedoresx"), "ask");
  });
});

describe("signInDestinationKind", () => {
  it("reconoce cada flujo", () => {
    assert.equal(signInDestinationKind("/cuenta?seccion=perfil"), "account");
    assert.equal(signInDestinationKind("/proveedores/registro?alta=1"), "alta");
    assert.equal(signInDestinationKind("/proveedores/contratar?plan=plus"), "contratar");
    assert.equal(signInDestinationKind("/proveedores/contratar/resultado?partnerId=x"), "resultado");
    assert.equal(signInDestinationKind("/proveedores/reclamar?next=%2Fproveedores%2Fcontratar"), "reclamar");
    assert.equal(signInDestinationKind("/blog"), "other");
  });
});
