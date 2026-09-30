import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertSlate, checkSlate, SlateGrammarError } from "../lib/slate.ts";
import { fixture } from "./helpers.ts";

const p = (text: string) => ({ type: "paragraph", children: [{ text }] });

describe("assertSlate", () => {
  it("acepta el golden", () => {
    assert.doesNotThrow(() => assertSlate(JSON.parse(fixture("valid-full.slate.json"))));
  });

  it("rechaza heading-seven (el dry_run de Hygraph lo acepta)", () => {
    assert.throws(
      () => assertSlate({ children: [{ type: "heading-seven", children: [{ text: "x" }] }] }),
      (err: unknown) => err instanceof SlateGrammarError && /heading-seven/.test(err.message),
    );
  });

  it("rechaza un paragraph directo dentro de una lista", () => {
    const issues = checkSlate({ children: [{ type: "bulleted-list", children: [p("x")] }] });
    assert.equal(issues.length, 1);
    assert.match(issues[0]!, /se esperaba list-item y vino "paragraph"/);
  });

  it("rechaza list-item-child → text sin paragraph", () => {
    const issues = checkSlate({
      children: [
        {
          type: "numbered-list",
          children: [{ type: "list-item", children: [{ type: "list-item-child", children: [{ text: "x" }] }] }],
        },
      ],
    });
    assert.equal(issues.length, 1);
  });

  it("rechaza una tabla sin table_head/table_body", () => {
    const issues = checkSlate({
      children: [{ type: "table", children: [{ type: "table_row", children: [{ type: "table_cell", children: [p("x")] }] }] }],
    });
    assert.match(issues.join("\n"), /\[table_head, table_body\]/);
  });

  it("rechaza celdas de header en el body y filas de distinto ancho", () => {
    const row = (type: string, n: number) => ({
      type: "table_row",
      children: Array.from({ length: n }, () => ({ type, children: [p("x")] })),
    });
    const issues = checkSlate({
      children: [
        {
          type: "table",
          children: [
            { type: "table_head", children: [row("table_header_cell", 2)] },
            { type: "table_body", children: [row("table_header_cell", 2), row("table_cell", 3)] },
          ],
        },
      ],
    });
    // 2 celdas de header dentro del body + 1 fila de 3 celdas.
    assert.equal(issues.length, 3);
  });

  it("rechaza marcas desconocidas, links sin href y bloques dentro de un paragraph", () => {
    const issues = checkSlate({
      children: [
        { type: "paragraph", children: [{ text: "x", underline: true }] },
        { type: "paragraph", children: [{ type: "link", children: [{ text: "x" }] }] },
        { type: "paragraph", children: [p("x")] },
      ],
    });
    assert.equal(issues.length, 3);
  });

  it("rechaza embed sin nodeId o con otro nodeType", () => {
    const issues = checkSlate({ children: [{ type: "embed", nodeType: "Post", children: [{ text: "" }] }] });
    assert.equal(issues.length, 2);
  });

  it("rechaza content vacío o mal formado", () => {
    assert.deepEqual(checkSlate([]), ["content tiene que ser { children: [...] }"]);
    assert.deepEqual(checkSlate({ children: [] }), ["content sin bloques"]);
  });
});
