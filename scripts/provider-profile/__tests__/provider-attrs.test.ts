import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseProviderAction,
  parseProviderAttr,
} from "../../../lib/analytics/provider-attrs.ts";

const ACTIONS: ReadonlySet<string> = new Set(["call", "directions", "proposal", "share"]);

test("un slug válido pasa", () => {
  assert.equal(parseProviderAttr("mecanica-barrancas-san-isidro"), "mecanica-barrancas-san-isidro");
});

test("un provider con formato inválido devuelve undefined", () => {
  for (const bad of ["", "Mecanica", "a b", "a_b", "-a", "a--b", "<script>"]) {
    assert.equal(parseProviderAttr(bad), undefined, bad);
  }
  assert.equal(parseProviderAttr(undefined), undefined);
  assert.equal(parseProviderAttr("a".repeat(121)), undefined);
});

test("una acción de la lista cerrada pasa", () => {
  assert.equal(parseProviderAction("call", ACTIONS), "call");
  assert.equal(parseProviderAction("share", ACTIONS), "share");
});

test("una acción fuera de la lista devuelve undefined", () => {
  assert.equal(parseProviderAction("inventada", ACTIONS), undefined);
  assert.equal(parseProviderAction("", ACTIONS), undefined);
  assert.equal(parseProviderAction(undefined, ACTIONS), undefined);
});
