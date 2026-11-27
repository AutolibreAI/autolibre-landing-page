import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSignInHref,
  DEFAULT_SIGN_IN_DESTINATION,
  parseSafeRedirect,
  requiresSession,
  signInDestinationKind,
  signInExitHistoryIndex,
  signInExitPath,
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

// La cruz de `/ingresar` (2026-11-27): el `?redirect=` es el destino después
// de entrar y casi siempre pide sesión; la salida es la página pública de origen.

describe("requiresSession", () => {
  it("las pantallas privadas del proxy y el flujo del alta piden sesión", () => {
    for (const value of [
      "/cuenta",
      "/cuenta?seccion=plan",
      "/proveedores/contratar?plan=plus",
      "/proveedores/contratar/resultado?partnerId=x",
      "/proveedores/reclamar",
      "/proveedores/registro?alta=1",
      "/proveedores/registro?next=%2Fproveedores%2Fcontratar%3Fplan%3Dplus",
    ]) {
      assert.equal(requiresSession(value), true, value);
    }
  });

  it("las páginas públicas no", () => {
    for (const value of ["/", "/proveedores", "/proveedores/registro", "/proveedores/planes", "/blog", "/cuentax"]) {
      assert.equal(requiresSession(value), false, value);
    }
  });
});

describe("signInExitPath", () => {
  it("el alta sale a la landing, sin reabrir el flujo", () => {
    assert.equal(signInExitPath("/proveedores/registro?alta=1"), "/proveedores/registro");
    assert.equal(
      signInExitPath("/proveedores/registro?next=%2Fproveedores%2Fcontratar%3Fplan%3Dplus&alta=1"),
      "/proveedores/registro",
    );
  });

  it("contratar y su resultado salen a los planes", () => {
    assert.equal(signInExitPath("/proveedores/contratar?plan=plus"), "/proveedores/planes");
    assert.equal(signInExitPath("/proveedores/contratar/resultado?partnerId=x"), "/proveedores/planes");
  });

  it("reclamar sale a la landing de negocios", () => {
    assert.equal(signInExitPath("/proveedores/reclamar"), "/proveedores/registro");
    assert.equal(signInExitPath("/proveedores/reclamar?next=%2Fproveedores%2Fcontratar"), "/proveedores/registro");
  });

  it("/cuenta y cualquier otro destino salen al Home", () => {
    assert.equal(signInExitPath("/cuenta"), "/");
    assert.equal(signInExitPath("/cuenta?salir=1"), "/");
    assert.equal(signInExitPath("/blog"), "/");
    assert.equal(signInExitPath(parseSafeRedirect("https://evil.com")), "/");
  });

  it("nunca devuelve una ruta que pida sesión", () => {
    for (const value of [
      "/cuenta",
      "/proveedores/registro?alta=1",
      "/proveedores/contratar?plan=plus",
      "/proveedores/contratar/resultado",
      "/proveedores/reclamar",
      "/pedido",
    ]) {
      assert.equal(requiresSession(signInExitPath(value)), false, value);
    }
  });
});

describe("signInExitHistoryIndex", () => {
  const origin = "https://autolibre.ai";
  const entries = (...paths: (string | null)[]) =>
    paths.map((path) => ({ url: path === null ? null : `${origin}${path}` }));

  it("vuelve a la página anterior del mismo sitio", () => {
    const list = entries("/", "/proveedores/registro", "/ingresar?redirect=%2Fcuenta");
    assert.equal(signInExitHistoryIndex(list, 2, origin), 1);
  });

  it("saltea los pasos de Clerk y los logins anteriores", () => {
    const list = entries("/blog", "/ingresar", "/ingresar#/factor-one", "/ingresar#/sso-callback");
    assert.equal(signInExitHistoryIndex(list, 3, origin), 0);
  });

  it("sin entrada anterior (URL directa, pestaña nueva, vuelta de Google) usa el href", () => {
    assert.equal(signInExitHistoryIndex(entries("/ingresar"), 0, origin), -1);
    assert.equal(signInExitHistoryIndex(entries("/ingresar", "/ingresar#/sso-callback"), 1, origin), -1);
    assert.equal(signInExitHistoryIndex([], -1, origin), -1);
  });

  it("no vuelve a una pantalla que pide sesión", () => {
    assert.equal(signInExitHistoryIndex(entries("/", "/proveedores/registro?alta=1", "/ingresar"), 2, origin), -1);
    assert.equal(signInExitHistoryIndex(entries("/", "/cuenta", "/ingresar"), 2, origin), -1);
  });

  it("no vuelve a una entrada sin URL o de otro origen", () => {
    assert.equal(signInExitHistoryIndex(entries("/", null, "/ingresar"), 2, origin), -1);
    const external = [{ url: "https://accounts.google.com/x" }, { url: `${origin}/ingresar` }];
    assert.equal(signInExitHistoryIndex(external, 1, origin), -1);
    assert.equal(signInExitHistoryIndex([{ url: "no es una url" }, { url: `${origin}/ingresar` }], 1, origin), -1);
  });

  it("ignora las entradas posteriores a la actual", () => {
    assert.equal(signInExitHistoryIndex(entries("/blog", "/ingresar", "/pedido"), 1, origin), 0);
  });
});
