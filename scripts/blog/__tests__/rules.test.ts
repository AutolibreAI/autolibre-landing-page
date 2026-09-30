import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateDraft, type Issue } from "../lib/rules.ts";
import { fixture, testContext, validWith } from "./helpers.ts";

const FILE = "content-pipeline/drafts/valid-full.md";

function validate(source: string, file = FILE) {
  return validateDraft({ file, source, ...testContext() });
}

function messages(issues: readonly Issue[]): string {
  return issues.map((i) => `[${i.rule}] ${i.message}`).join("\n");
}

describe("validateDraft: draft válido", () => {
  it("P4-S6: el draft completo pasa (solo warnings)", () => {
    const result = validate(fixture("valid-full.md"));
    assert.deepEqual(result.errors, [], messages(result.errors));
    // Warnings esperados: DOC-01 es mixto y el fixture es corto.
    assert.deepEqual(result.warnings.map((w) => w.rule).sort(), ["src-mixed", "words"]);
  });
});

/**
 * Un fixture por rechazo (`__fixtures__/reject/*.md`): cada uno se agrega al
 * final del draft válido y tiene que producir exactamente estos errores.
 */
const REJECTIONS: Record<string, readonly RegExp[]> = {
  "h1.md": [/heading h1 no permitido/],
  "h5.md": [/heading h5 no permitido/],
  "heading-skip.md": [/salto de heading: h4 después de h2/],
  "nested-list.md": [/listas anidadas no permitidas/],
  "html.md": [/HTML no permitido/],
  "inline-html.md": [/HTML no permitido/],
  "code.md": [/bloques de código no permitidos/],
  "inline-code.md": [/código inline/],
  "hr.md": [/separadores/],
  "ref-link.md": [/links por referencia/, /definiciones de links por referencia/],
  "star-bullet.md": [/viñetas con `\*`/],
  "table-irregular.md": [/tabla irregular: la fila tiene 3 celdas y el encabezado 2/],
  "table-no-separator.md": [/tabla sin fila separadora/],
  "table-one-column.md": [/tabla con menos de 2 columnas/],
  "src-missing.md": [/\[src:ZZZ-99\] no existe/, /\[src:ZZZ-99\] se cita pero no está en sourceIds/],
  "src-contradiction.md": [/\[src:VTV-07\] no se puede citar/, /\[src:VTV-07\] se cita pero no está en sourceIds/],
  "src-pending.md": [/\[src:LIC-09\] no se puede citar/, /\[src:LIC-09\] se cita pero no está en sourceIds/],
  "image-no-alt.md": [/no tiene alt/],
  "image-inline.md": [/las imágenes van solas/],
  "image-undeclared.md": [/no está declarada en `images`/],
  "link-unpublished.md": [/ese post no está publicado/],
  "link-http.md": [/tienen que ser https/],
  "faq-no-question-mark.md": [/no termina en "\?"/],
  "faq-no-answer.md": [/no tiene respuesta/],
  "unclosed-bold.md": [/`\*\*` sin cerrar/],
};

describe("validateDraft: un fixture por rechazo", () => {
  for (const [name, expected] of Object.entries(REJECTIONS)) {
    it(name, () => {
      const { source } = validWith(fixture(`reject/${name}`));
      const result = validate(source);
      assert.equal(result.errors.length, expected.length, messages(result.errors));
      for (const re of expected) {
        assert.ok(
          result.errors.some((e) => re.test(e.message)),
          `falta un error que matchee ${re}:\n${messages(result.errors)}`,
        );
      }
    });
  }

  it("los errores del subset traen el número de línea del archivo", () => {
    const { source, snippetLine } = validWith(fixture("reject/h5.md"));
    const [error] = validate(source).errors;
    assert.equal(error!.line, snippetLine);
  });
});

describe("validateDraft: frontmatter y plan", () => {
  const base = fixture("valid-full.md");

  it("P4-S3: metaTitle de 49 caracteres falla; de 48 pasa", () => {
    const title48 = "a".repeat(48);
    const ok = validate(base.replace('metaTitle: "Papeles para circular en AMBA"', `metaTitle: "${title48}"`));
    assert.deepEqual(ok.errors, []);
    const bad = validate(base.replace('metaTitle: "Papeles para circular en AMBA"', `metaTitle: "${title48}é"`));
    assert.equal(bad.errors.length, 1);
    assert.match(bad.errors[0]!.message, /metaTitle tiene 49 caracteres/);
  });

  it("excerpt vacío falla", () => {
    const result = validate(base.replace(/^excerpt: .*$/m, 'excerpt: ""'));
    assert.match(messages(result.errors), /falta `excerpt`/);
  });

  it("P4-S5: cover sin alt falla", () => {
    const result = validate(base.replace('  alt: "Guantera abierta con la cédula y la licencia"\n', ""));
    assert.match(messages(result.errors), /la cover no tiene `alt`/);
  });

  it("reviewedAt con formato inválido falla", () => {
    const result = validate(base.replace("reviewedAt: 2026-09-30", "reviewedAt: 30/09/2026"));
    assert.match(messages(result.errors), /reviewedAt/);
  });

  it("slug distinto del nombre de archivo falla", () => {
    const result = validate(base, "content-pipeline/drafts/otro-nombre.md");
    assert.match(messages(result.errors), /no coincide con el archivo "otro-nombre.md"/);
  });

  it("slug que no está en el plan o está bloqueado falla", () => {
    const missing = validate(base.replace("slug: valid-full", "slug: no-esta"), "drafts/no-esta.md");
    assert.match(messages(missing.errors), /no está en plan.yaml/);
    const blocked = validate(base.replace("slug: valid-full", "slug: vtv-caba"), "drafts/vtv-caba.md");
    assert.match(messages(blocked.errors), /bloqueado en plan.yaml: VTV-07/);
  });

  it("sourceId declarado y no citado falla", () => {
    const result = validate(base.replace(" [src:CED-02]", ""));
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0]!.message, /CED-02 está en sourceIds pero no se cita/);
  });

  it("FAQ con una sola pregunta falla", () => {
    const cut = base.slice(0, base.indexOf("### ¿Vale la licencia en el celular?"));
    const result = validate(cut.replace(" [src:DOC-02].", ".").replace(", DOC-02]", "]").replace(",DOC-02]", "]"));
    assert.match(messages(result.errors), /al menos 2 preguntas/);
  });

  it("frontmatter ausente falla sin romper", () => {
    const result = validate("## Hola\n\nTexto.\n");
    assert.match(messages(result.errors), /falta el frontmatter/);
  });

  it("warnings: fuente verificada hace más de 90 días y metaDescription corta", () => {
    const source = validWith("Patente al día [src:PAT-01].\n").source
      .replace("sourceIds: [DOC-01, DOC-02, CED-02]", "sourceIds: [DOC-01, DOC-02, CED-02, PAT-01]")
      .replace(/^metaDescription: .*$/m, 'metaDescription: "Corta."');
    const result = validate(source);
    assert.deepEqual(result.errors, [], messages(result.errors));
    const rules = result.warnings.map((w) => w.rule);
    assert.ok(rules.includes("src-age"), messages(result.warnings));
    assert.ok(rules.includes("metaDescription"), messages(result.warnings));
  });
});
