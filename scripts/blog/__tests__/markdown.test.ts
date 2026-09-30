import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { splitFrontmatter } from "../lib/frontmatter.ts";
import { parseMarkdown } from "../lib/markdown.ts";
import { mdToSlate } from "../lib/slate.ts";
import { fixture } from "./helpers.ts";

const ASSETS = new Map([["images/valid-full-celular.webp", "asset-inline-1"]]);

function convert(body: string) {
  const parsed = parseMarkdown(body);
  assert.deepEqual(parsed.errors, []);
  return mdToSlate(parsed.blocks, { assetIds: ASSETS });
}

describe("parseMarkdown + mdToSlate", () => {
  it("golden: valid-full.md → valid-full.slate.json (incluye tabla, listas y embed)", () => {
    const fm = splitFrontmatter(fixture("valid-full.md"));
    assert.equal(fm.error, null);
    const parsed = parseMarkdown(fm.body, fm.bodyLine);
    assert.deepEqual(parsed.errors, []);
    const content = mdToSlate(parsed.blocks, { assetIds: ASSETS });
    assert.deepEqual(content, JSON.parse(fixture("valid-full.slate.json")));
  });

  it("es determinista: misma entrada → misma salida", () => {
    const body = splitFrontmatter(fixture("valid-full.md")).body;
    assert.equal(JSON.stringify(convert(body)), JSON.stringify(convert(body)));
  });

  it("P5-S2: quita los marcadores [src:ID] del texto", () => {
    const content = convert("texto [src:DOC-01].");
    assert.deepEqual(content.children, [{ type: "paragraph", children: [{ text: "texto." }] }]);
  });

  it("junta los IDs de [src:ID,ID] con su línea", () => {
    const parsed = parseMarkdown("uno [src:DOC-01, DOC-02]\n\ndos [src:CED-02]", 10);
    assert.deepEqual(parsed.sourceRefs, [
      { id: "DOC-01", line: 10 },
      { id: "DOC-02", line: 10 },
      { id: "CED-02", line: 12 },
    ]);
  });

  it("P5-S3: cada ítem de lista es list-item → list-item-child → paragraph", () => {
    const content = convert("- uno\n- **dos**\n\n- tres");
    assert.deepEqual(content.children, [
      {
        type: "bulleted-list",
        children: ["uno", "dos", "tres"].map((text, i) => ({
          type: "list-item",
          children: [
            {
              type: "list-item-child",
              children: [{ type: "paragraph", children: [i === 1 ? { text, bold: true } : { text }] }],
            },
          ],
        })),
      },
    ]);
  });

  it("P5-S1: tabla 2×3 → table > table_head/table_body > table_row > celdas > paragraph", () => {
    const content = convert("| Doc | Digital |\n|:--|--:|\n| Licencia | Sí |\n| Cédula | Sí |\n| DNI | *Sí* |");
    const cell = (type: string, text: string, italic = false) => ({
      type,
      children: [{ type: "paragraph", children: [italic ? { text, italic: true } : { text }] }],
    });
    assert.deepEqual(content.children, [
      {
        type: "table",
        children: [
          {
            type: "table_head",
            children: [{ type: "table_row", children: [cell("table_header_cell", "Doc"), cell("table_header_cell", "Digital")] }],
          },
          {
            type: "table_body",
            children: [
              { type: "table_row", children: [cell("table_cell", "Licencia"), cell("table_cell", "Sí")] },
              { type: "table_row", children: [cell("table_cell", "Cédula"), cell("table_cell", "Sí")] },
              { type: "table_row", children: [cell("table_cell", "DNI"), cell("table_cell", "Sí", true)] },
            ],
          },
        ],
      },
    ]);
  });

  it("links: externos con openInNewTab, internos sin; marks dentro del link", () => {
    const content = convert("[**Ley**](https://a.gob.ar) y [nota](/blog/x/y)");
    assert.deepEqual(content.children, [
      {
        type: "paragraph",
        children: [
          { type: "link", href: "https://a.gob.ar", openInNewTab: true, children: [{ text: "Ley", bold: true }] },
          { text: " y " },
          { type: "link", href: "/blog/x/y", children: [{ text: "nota" }] },
        ],
      },
    ]);
  });

  it("bold + italic anidados y escapes", () => {
    const content = convert("***ambos*** y \\*literal\\*");
    assert.deepEqual(content.children, [
      { type: "paragraph", children: [{ text: "ambos", bold: true, italic: true }, { text: " y *literal*" }] },
    ]);
  });

  it("párrafo multilínea se une con espacios; > es block-quote", () => {
    const content = convert("línea uno\nlínea dos\n\n> cita\n> sigue");
    assert.deepEqual(content.children, [
      { type: "paragraph", children: [{ text: "línea uno línea dos" }] },
      { type: "block-quote", children: [{ text: "cita sigue" }] },
    ]);
  });

  it("imagen sin assetId → error de conversión", () => {
    const parsed = parseMarkdown("![alt](images/nada.webp)");
    assert.throws(() => mdToSlate(parsed.blocks, { assetIds: ASSETS }), /no tiene assetId/);
  });

  it("P4-S1: rechaza ##### con número de línea", () => {
    const parsed = parseMarkdown("## ok\n\n##### x", 5);
    assert.deepEqual(parsed.errors, [{ line: 7, message: "heading h5 no permitido (solo ##, ### y ####)" }]);
  });

  it("P4-S4: rechaza una fila de 3 celdas con header de 2", () => {
    const parsed = parseMarkdown("| a | b |\n|---|---|\n| 1 | 2 | 3 |");
    assert.equal(parsed.errors.length, 1);
    assert.match(parsed.errors[0]!.message, /tabla irregular: la fila tiene 3 celdas y el encabezado 2/);
    assert.equal(parsed.errors[0]!.line, 3);
  });
});
