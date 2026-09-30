import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sha256 } from "../lib/payload.ts";
import { compareRoundtrip, extractRaw } from "../lib/roundtrip.ts";

const RAW = { children: [{ type: "paragraph", children: [{ text: "Hola" }] }] };

describe("roundtrip", () => {
  it("extrae content.raw de {data:{post}} y de {post}", () => {
    assert.deepEqual(extractRaw({ data: { post: { content: { raw: RAW } } } }), RAW);
    assert.deepEqual(extractRaw({ post: { content: { raw: RAW } } }), RAW);
    assert.equal(extractRaw({ data: { post: null } }), undefined);
    assert.equal(extractRaw(null), undefined);
  });

  it("match cuando el hash coincide, sin importar el orden de las claves", () => {
    const reordered = { children: [{ children: [{ text: "Hola" }], type: "paragraph" }] };
    const result = compareRoundtrip({ data: { post: { content: { raw: reordered } } } }, sha256(RAW));
    assert.equal(result.status, "match");
  });

  it("mismatch cuando Hygraph devuelve otro contenido", () => {
    const other = { children: [{ type: "paragraph", children: [{ text: "Chau" }] }] };
    const result = compareRoundtrip({ data: { post: { content: { raw: other } } } }, sha256(RAW));
    assert.equal(result.status, "mismatch");
  });

  it("missing cuando no hay post", () => {
    assert.equal(compareRoundtrip({ data: { post: null } }, sha256(RAW)).status, "missing");
  });
});
