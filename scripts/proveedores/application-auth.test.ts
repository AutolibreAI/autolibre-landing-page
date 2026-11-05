import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PROVIDER_APPLICATION_ENDPOINT,
  forwardableAuthorization,
  submitWithOwnerToken,
  type OwnerGetToken,
} from "../../lib/proveedores/application-auth.ts";

// Alta con dueño (spec 212, US3; research D17): el formulario SIEMPRE manda el
// Bearer, ante un 401 renueva el token y reintenta UNA vez con el header, y
// nunca cae a un alta anónima.

type Call = { readonly url: string; readonly init: RequestInit };

function fakeFetch(statuses: readonly number[]) {
  const calls: Call[] = [];
  const impl = async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const status = statuses[calls.length - 1] ?? 500;
    return new Response(JSON.stringify({}), { status });
  };
  return { calls, impl };
}

function fakeGetToken(tokens: { readonly cached: string | null; readonly fresh: string | null }) {
  const requests: Array<{ readonly skipCache?: boolean } | undefined> = [];
  const getToken: OwnerGetToken = async (options) => {
    requests.push(options);
    return options?.skipCache ? tokens.fresh : tokens.cached;
  };
  return { requests, getToken };
}

const authorizationOf = (call: Call | undefined) =>
  new Headers(call?.init.headers).get("Authorization");

describe("envío del alta con el token de la sesión", () => {
  it("manda el Bearer y devuelve la respuesta cuando no es 401", async () => {
    const { calls, impl } = fakeFetch([200]);
    const { requests, getToken } = fakeGetToken({ cached: "tok-1", fresh: "tok-2" });

    const outcome = await submitWithOwnerToken("{}", getToken, impl);

    assert.equal(outcome.kind, "response");
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, PROVIDER_APPLICATION_ENDPOINT);
    assert.equal(calls[0]?.init.method, "POST");
    assert.equal(authorizationOf(calls[0]), "Bearer tok-1");
    assert.deepEqual(requests, [undefined]);
  });

  it("los errores que no son de sesión (400, 409, 502) no se reintentan", async () => {
    for (const status of [400, 409, 502]) {
      const { calls, impl } = fakeFetch([status]);
      const { getToken } = fakeGetToken({ cached: "tok-1", fresh: "tok-2" });

      const outcome = await submitWithOwnerToken("{}", getToken, impl);

      assert.equal(outcome.kind, "response");
      assert.equal(outcome.kind === "response" && outcome.response.status, status);
      assert.equal(calls.length, 1);
    }
  });

  it("ante un 401 renueva el token (skipCache) y reintenta UNA vez con el header", async () => {
    const { calls, impl } = fakeFetch([401, 200]);
    const { requests, getToken } = fakeGetToken({ cached: "viejo", fresh: "nuevo" });

    const outcome = await submitWithOwnerToken("{}", getToken, impl);

    assert.equal(outcome.kind, "response");
    assert.equal(calls.length, 2);
    assert.equal(authorizationOf(calls[0]), "Bearer viejo");
    assert.equal(authorizationOf(calls[1]), "Bearer nuevo");
    assert.deepEqual(requests, [undefined, { skipCache: true }]);
  });

  it("si el reintento también da 401, pide volver a entrar (sin un tercer intento)", async () => {
    const { calls, impl } = fakeFetch([401, 401, 200]);
    const { getToken } = fakeGetToken({ cached: "viejo", fresh: "nuevo" });

    const outcome = await submitWithOwnerToken("{}", getToken, impl);

    assert.deepEqual(outcome, { kind: "unauthenticated" });
    assert.equal(calls.length, 2);
    for (const call of calls) assert.match(authorizationOf(call) ?? "", /^Bearer /);
  });

  it("sin token en cache prueba uno nuevo; nunca manda el alta sin header", async () => {
    const { calls, impl } = fakeFetch([200]);
    const { getToken } = fakeGetToken({ cached: null, fresh: "nuevo" });

    const outcome = await submitWithOwnerToken("{}", getToken, impl);

    assert.equal(outcome.kind, "response");
    assert.equal(calls.length, 1);
    assert.equal(authorizationOf(calls[0]), "Bearer nuevo");
  });

  it("sin ningún token no hace el POST: pide volver a entrar", async () => {
    const { calls, impl } = fakeFetch([200]);
    const { getToken } = fakeGetToken({ cached: null, fresh: null });

    assert.deepEqual(await submitWithOwnerToken("{}", getToken, impl), { kind: "unauthenticated" });
    assert.equal(calls.length, 0);
  });

  it("si el 401 llega y el token renovado no existe, no reintenta sin header", async () => {
    const { calls, impl } = fakeFetch([401]);
    const { getToken } = fakeGetToken({ cached: "viejo", fresh: null });

    assert.deepEqual(await submitWithOwnerToken("{}", getToken, impl), { kind: "unauthenticated" });
    assert.equal(calls.length, 1);
  });
});

describe("header que la ruta reenvía al backend", () => {
  it("pasa el header tal cual, sin tocarlo", () => {
    assert.equal(forwardableAuthorization("Bearer abc.def.ghi"), "Bearer abc.def.ghi");
  });

  it("sin header (o vacío) no reenvía nada", () => {
    assert.equal(forwardableAuthorization(null), undefined);
    assert.equal(forwardableAuthorization(undefined), undefined);
    assert.equal(forwardableAuthorization("   "), undefined);
  });
});
