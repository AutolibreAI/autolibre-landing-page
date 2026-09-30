import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractFaq, normalizeHeading } from "../../../lib/blog/faq.ts";

const h2 = (text: string) => ({ type: "heading-two", children: [{ text }] });
const h3 = (text: string) => ({ type: "heading-three", children: [{ text }] });
const p = (...children: object[]) => ({ type: "paragraph", children });

describe("extractFaq", () => {
  it("F2-S1: 3 preguntas con respuesta → 3 ítems en texto plano", () => {
    const content = {
      children: [
        h2("Intro"),
        p({ text: "nada" }),
        h2("Preguntas frecuentes"),
        h3("¿Uno?"),
        p({ text: "Respuesta " }, { text: "uno", bold: true }, { text: "." }),
        h3("¿Dos?"),
        p({ text: "Ver " }, { type: "link", href: "/x", children: [{ text: "acá" }] }),
        p({ text: "Segundo párrafo." }),
        h3("¿Tres?"),
        {
          type: "bulleted-list",
          children: [
            { type: "list-item", children: [{ type: "list-item-child", children: [p({ text: "a" })] }] },
            // Forma que ya usan posts de Hygraph: list-item-child → text sin paragraph.
            { type: "list-item", children: [{ type: "list-item-child", children: [{ text: "b" }] }] },
          ],
        },
        h2("Otra sección"),
        h3("¿Esta no?"),
        p({ text: "no cuenta" }),
      ],
    };
    assert.deepEqual(extractFaq(content, "Preguntas frecuentes"), [
      { question: "¿Uno?", answer: "Respuesta uno." },
      { question: "¿Dos?", answer: "Ver acá\nSegundo párrafo." },
      { question: "¿Tres?", answer: "a\nb" },
    ]);
  });

  it("F2-S2: una pregunta sin respuesta se omite", () => {
    const content = [h2("Preguntas frecuentes"), h3("¿Sin respuesta?"), h3("¿Con?"), p({ text: "Sí." }), h3("¿Última vacía?")];
    assert.deepEqual(extractFaq(content, "Preguntas frecuentes"), [{ question: "¿Con?", answer: "Sí." }]);
  });

  it("F2-S3: sin sección FAQ → []", () => {
    assert.deepEqual(extractFaq({ children: [h2("Otra"), h3("¿x?"), p({ text: "y" })] }, "Preguntas frecuentes"), []);
    assert.deepEqual(extractFaq(null, "Preguntas frecuentes"), []);
  });

  it("compara el heading normalizado (mayúsculas, tildes, espacios)", () => {
    assert.equal(normalizeHeading("  PREGUNTAS   Frecuéntes "), "preguntas frecuentes");
    const content = [h2("Preguntas  FRECUENTES"), h3("¿x?"), p({ text: "y" })];
    assert.equal(extractFaq(content, "Preguntas frecuentes").length, 1);
  });

  it("tablas en la respuesta: una fila por línea", () => {
    const cell = (type: string, text: string) => ({ type, children: [p({ text })] });
    const table = {
      type: "table",
      children: [
        {
          type: "table_head",
          children: [{ type: "table_row", children: [cell("table_header_cell", "A"), cell("table_header_cell", "B")] }],
        },
        { type: "table_body", children: [{ type: "table_row", children: [cell("table_cell", "1"), cell("table_cell", "2")] }] },
      ],
    };
    assert.deepEqual(extractFaq([h2("Preguntas frecuentes"), h3("¿T?"), table], "Preguntas frecuentes"), [
      { question: "¿T?", answer: "A | B\n1 | 2" },
    ]);
  });
});
