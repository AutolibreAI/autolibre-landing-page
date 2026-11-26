import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bearerToken,
  handleSignupIntentRequest,
  isWithinSignupWindow,
  readSignupIntent,
  SIGNUP_INTENT_KEY,
  SIGNUP_INTENT_WINDOW_MS,
  type SignupIntent,
  type SignupIntentDeps,
} from "../../lib/auth/signup-intent.ts";

// `POST /api/account/intent` (registro: cliente o taller, 2026-11-24). Clerk
// va mockeado: el handler recibe la verificación del token, la lectura del
// usuario y la escritura de la metadata como dependencias.

const NOW = Date.UTC(2026, 10, 24, 15, 0, 0);
const VALID_TOKEN = "tok-valido";
const USER_ID = "user_123";

type FakeUser = { createdAt: number; publicMetadata: Record<string, unknown> };

function fakeClerk(user: FakeUser, options: { readonly failOn?: "getUser" | "write" } = {}) {
  const writes: Array<{ readonly userId: string; readonly intent: SignupIntent }> = [];
  const logs: string[] = [];
  const verified: string[] = [];
  const deps: SignupIntentDeps = {
    verifySessionToken: async (token) => {
      verified.push(token);
      if (token === "tok-explota") throw new Error("JWKS caído");
      return token === VALID_TOKEN ? USER_ID : null;
    },
    getUser: async (userId) => {
      assert.equal(userId, USER_ID);
      if (options.failOn === "getUser") throw new Error("Clerk 500 con datos: ana@example.com");
      return user;
    },
    writeIntent: async (userId, intent) => {
      if (options.failOn === "write") throw new Error("Clerk 429");
      writes.push({ userId, intent });
      user.publicMetadata = { ...user.publicMetadata, [SIGNUP_INTENT_KEY]: intent };
    },
    now: () => NOW,
    logError: (message) => logs.push(message),
  };
  return { deps, writes, logs, verified };
}

const newUser = (): FakeUser => ({ createdAt: NOW - 5 * 60 * 1000, publicMetadata: {} });
const bearer = `Bearer ${VALID_TOKEN}`;

describe("validación del intent", () => {
  it("rechaza valores fuera del contrato sin verificar el token ni escribir", async () => {
    for (const body of [{ intent: "admin" }, { intent: "" }, { intent: null }, {}, null, "partner", { intent: ["partner"] }]) {
      const { deps, writes, verified } = fakeClerk(newUser());
      const result = await handleSignupIntentRequest({ authorization: bearer, body }, deps);
      assert.equal(result.status, 400);
      assert.deepEqual(result.body, { error: "invalid_intent" });
      assert.equal(writes.length, 0);
      assert.equal(verified.length, 0);
    }
  });

  it("acepta los dos valores del contrato", async () => {
    for (const intent of ["partner", "customer"] as const) {
      const { deps, writes } = fakeClerk(newUser());
      const result = await handleSignupIntentRequest({ authorization: bearer, body: { intent } }, deps);
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, { intent, saved: true });
      assert.deepEqual(writes, [{ userId: USER_ID, intent }]);
    }
  });
});

describe("token", () => {
  it("401 sin header, con un header mal formado o con un token inválido", async () => {
    for (const authorization of [null, "", "Basic abc", "Bearer", "tok-valido", "Bearer tok-otro", "Bearer tok-explota"]) {
      const { deps, writes } = fakeClerk(newUser());
      const result = await handleSignupIntentRequest({ authorization, body: { intent: "partner" } }, deps);
      assert.equal(result.status, 401, String(authorization));
      assert.deepEqual(result.body, { error: "unauthenticated" });
      assert.equal(writes.length, 0);
    }
  });

  it("el userId sale del token verificado, nunca del cuerpo", async () => {
    const { deps, writes } = fakeClerk(newUser());
    const result = await handleSignupIntentRequest(
      { authorization: bearer, body: { intent: "partner", userId: "user_victima" } },
      deps,
    );
    assert.equal(result.status, 200);
    assert.deepEqual(writes, [{ userId: USER_ID, intent: "partner" }]);
  });

  it("bearerToken solo acepta `Bearer <token>`", () => {
    assert.equal(bearerToken("Bearer abc.def"), "abc.def");
    assert.equal(bearerToken("bearer abc"), "abc");
    assert.equal(bearerToken("Bearer a b"), null);
    assert.equal(bearerToken(undefined), null);
  });
});

describe("idempotencia", () => {
  it("si ya hay intent no lo pisa y devuelve el vigente", async () => {
    const user: FakeUser = { createdAt: NOW - 60_000, publicMetadata: { [SIGNUP_INTENT_KEY]: "customer" } };
    const { deps, writes } = fakeClerk(user);
    const result = await handleSignupIntentRequest({ authorization: bearer, body: { intent: "partner" } }, deps);
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { intent: "customer", saved: false });
    assert.equal(writes.length, 0);
  });

  it("dos llamadas seguidas escriben una sola vez", async () => {
    const { deps, writes } = fakeClerk(newUser());
    const first = await handleSignupIntentRequest({ authorization: bearer, body: { intent: "partner" } }, deps);
    const second = await handleSignupIntentRequest({ authorization: bearer, body: { intent: "partner" } }, deps);
    assert.deepEqual(first.body, { intent: "partner", saved: true });
    assert.deepEqual(second.body, { intent: "partner", saved: false });
    assert.equal(writes.length, 1);
  });

  it("un intent existente pero inválido se trata como ausente", async () => {
    const user: FakeUser = { createdAt: NOW - 60_000, publicMetadata: { [SIGNUP_INTENT_KEY]: "admin", otra: 1 } };
    const { deps, writes } = fakeClerk(user);
    const result = await handleSignupIntentRequest({ authorization: bearer, body: { intent: "customer" } }, deps);
    assert.deepEqual(result.body, { intent: "customer", saved: true });
    assert.equal(writes.length, 1);
  });
});

describe("ventana de 30 minutos", () => {
  it("una cuenta vieja sin intent no puede autoasignarse uno", async () => {
    const user: FakeUser = { createdAt: NOW - SIGNUP_INTENT_WINDOW_MS - 1, publicMetadata: {} };
    const { deps, writes } = fakeClerk(user);
    const result = await handleSignupIntentRequest({ authorization: bearer, body: { intent: "partner" } }, deps);
    assert.equal(result.status, 403);
    assert.deepEqual(result.body, { error: "window_closed" });
    assert.equal(writes.length, 0);
  });

  it("justo en el límite todavía se acepta", async () => {
    const user: FakeUser = { createdAt: NOW - SIGNUP_INTENT_WINDOW_MS, publicMetadata: {} };
    const { deps } = fakeClerk(user);
    const result = await handleSignupIntentRequest({ authorization: bearer, body: { intent: "partner" } }, deps);
    assert.equal(result.status, 200);
  });

  it("isWithinSignupWindow descarta fechas inválidas", () => {
    assert.equal(isWithinSignupWindow(Number.NaN, NOW), false);
    assert.equal(isWithinSignupWindow(NOW, NOW), true);
  });
});

describe("errores de Clerk", () => {
  it("502 sin filtrar el mensaje ni datos personales al log", async () => {
    for (const failOn of ["getUser", "write"] as const) {
      const { deps, logs } = fakeClerk(newUser(), { failOn });
      const result = await handleSignupIntentRequest({ authorization: bearer, body: { intent: "partner" } }, deps);
      assert.equal(result.status, 502);
      assert.deepEqual(result.body, { error: "unavailable" });
      assert.equal(logs.length, 1);
      assert.doesNotMatch(logs[0] ?? "", /example\.com|user_123|tok-|429|500/);
    }
  });
});

describe("lectura del intent", () => {
  it("lee solo valores válidos de la metadata pública", () => {
    assert.equal(readSignupIntent({ signupIntent: "partner" }), "partner");
    assert.equal(readSignupIntent({ signupIntent: "customer" }), "customer");
    assert.equal(readSignupIntent({ signupIntent: "PARTNER" }), null);
    assert.equal(readSignupIntent(undefined), null);
    assert.equal(readSignupIntent(null), null);
  });
});
