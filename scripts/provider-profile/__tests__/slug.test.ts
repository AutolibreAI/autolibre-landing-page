import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidSlug } from "../../../lib/provider-profile/slug.ts";

test("acepta un slug válido", () => {
  assert.equal(isValidSlug("mecanica-barrancas-san-isidro"), true);
  assert.equal(isValidSlug("taller-2"), true);
  assert.equal(isValidSlug("a"), true);
});

test("rechaza mayúsculas, tildes, guion bajo y espacios", () => {
  for (const bad of ["Mecanica", "mecánica", "mec_anica", "mec anica", "mec.anica"]) {
    assert.equal(isValidSlug(bad), false, bad);
  }
});

test("rechaza guiones al borde o dobles", () => {
  for (const bad of ["-taller", "taller-", "taller--uno"]) {
    assert.equal(isValidSlug(bad), false, bad);
  }
});

test("rechaza vacío y más de 120 caracteres", () => {
  assert.equal(isValidSlug(""), false);
  assert.equal(isValidSlug("a".repeat(120)), true);
  assert.equal(isValidSlug("a".repeat(121)), false);
});
