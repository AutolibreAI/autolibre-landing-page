import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { buildPayload, canonicalJson, sha256 } from "../lib/payload.ts";
import { fixture, fixturePath, testContext, TODAY } from "./helpers.ts";

const FILE = "content-pipeline/drafts/valid-full.md";

function build(source: string, relations?: { categoryId?: string; tagIds?: string[] }) {
  return buildPayload({ file: FILE, source, context: testContext(), relations });
}

describe("buildPayload", () => {
  it("arma el PostCreateInput con content validado, FAQ y relaciones", () => {
    const { payload, errors } = build(fixture("valid-full.md"), { categoryId: "cat-1", tagIds: ["tag-1", "tag-2"] });
    assert.deepEqual(errors, []);
    assert.ok(payload);
    const data = payload.variables.data;
    assert.equal(data.slug, "valid-full");
    assert.equal(data.reviewedAt, "2026-09-30");
    assert.equal(data.date, "2026-09-30");
    assert.deepEqual(data.sourceIds, ["DOC-01", "DOC-02", "CED-02"]);
    assert.deepEqual(data.seo, {
      create: {
        metaTitle: "Papeles para circular en AMBA",
        metaDescription:
          "Qué documentos tenés que llevar para manejar en CABA y Provincia: licencia, cédula, seguro y DNI, en papel o en el celular.",
      },
    });
    assert.deepEqual(data.content, JSON.parse(fixture("valid-full.slate.json")));
    assert.deepEqual(data.category, { connect: { id: "cat-1" } });
    assert.deepEqual(data.tags, { connect: [{ id: "tag-1" }, { id: "tag-2" }] });
    assert.deepEqual(data.coverImage, { connect: { id: "asset-cover-1" } });
    assert.equal(payload.faqCount, 2);
    assert.match(payload.mutation, /createPost\(data: \$data\)/);
    assert.doesNotMatch(payload.mutation, /publish/i);
  });

  it("P5: determinismo — misma entrada → mismo hash; otro contenido → otro hash", () => {
    const a = build(fixture("valid-full.md")).payload!;
    const b = build(fixture("valid-full.md")).payload!;
    assert.equal(a.hash, b.hash);
    assert.equal(a.contentHash, b.contentHash);
    const c = build(fixture("valid-full.md").replace("Ya no es exigible.", "Ya no se exige.")).payload!;
    assert.notEqual(a.hash, c.hash);
    assert.notEqual(a.contentHash, c.contentHash);
  });

  it("contentHash no depende del orden de las claves (roundtrip con content.raw)", () => {
    const { payload } = build(fixture("valid-full.md"));
    const reordered = JSON.parse(JSON.stringify(payload!.variables.data.content), (_key, value: unknown) =>
      value && typeof value === "object" && !Array.isArray(value)
        ? Object.fromEntries(Object.entries(value as Record<string, unknown>).reverse())
        : value,
    );
    assert.equal(sha256(reordered), payload!.contentHash);
    assert.equal(canonicalJson({ b: 1, a: [2, { d: 3, c: 4 }] }), '{"a":[2,{"c":4,"d":3}],"b":1}');
  });

  it("sin cover.assetId no arma payload", () => {
    const { payload, errors } = build(fixture("valid-full.md").replace("  assetId: asset-cover-1\n", ""));
    assert.equal(payload, null);
    assert.match(errors.map((e) => e.message).join("\n"), /falta `cover.assetId`/);
  });

  it("imagen inline sin assetId no arma payload", () => {
    const { payload, errors } = build(fixture("valid-full.md").replace("    assetId: asset-inline-1\n", ""));
    assert.equal(payload, null);
    assert.match(errors.map((e) => e.message).join("\n"), /no tiene assetId/);
  });

  it("un draft inválido no arma payload", () => {
    const { payload, errors } = build(`${fixture("valid-full.md")}\n##### h5\n`);
    assert.equal(payload, null);
    assert.equal(errors.length, 1);
  });

  it("tagIds que no coinciden con los tags del frontmatter fallan", () => {
    const { payload, errors } = build(fixture("valid-full.md"), { tagIds: ["solo-uno"] });
    assert.equal(payload, null);
    assert.match(errors[0]!.message, /2 tags/);
  });
});

describe("CLIs", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const common = ["--plan", fixturePath("plan.yaml"), "--sources", fixturePath("sources.md"), "--today", TODAY];
  const run = (script: string, args: string[]) =>
    spawnSync(
      process.execPath,
      ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", path.join(root, "scripts/blog", script), ...args],
      { encoding: "utf8", cwd: root },
    );

  it("validate: exit 0 con el draft válido y JSON con --json", () => {
    const res = run("validate.ts", ["--json", fixturePath("valid-full.md"), ...common]);
    assert.equal(res.status, 0, res.stderr);
    const out = JSON.parse(res.stdout);
    assert.equal(out.ok, true);
    assert.deepEqual(out.errors, []);
  });

  it("validate: exit 1 con errores (fuente ⚠️)", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "blog-validate-"));
    try {
      const draft = path.join(dir, "valid-full.md");
      const source = fixture("valid-full.md").replace("[src:CED-02]", "[src:CED-02] [src:VTV-07]");
      writeFileSync(draft, source);
      const res = run("validate.ts", [draft, ...common]);
      assert.equal(res.status, 1);
      assert.match(res.stdout, /ERROR .*\[src\] \[src:VTV-07\] no se puede citar/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("build-payload: escribe <slug>.json con el mismo hash en dos corridas", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "blog-payload-"));
    try {
      const args = [fixturePath("valid-full.md"), "--out", dir, "--category-id", "cat-1", "--tag-ids", "t1,t2", ...common];
      const first = run("build-payload.ts", args);
      assert.equal(first.status, 0, first.stderr);
      const a = JSON.parse(readFileSync(path.join(dir, "valid-full.json"), "utf8"));
      const second = run("build-payload.ts", args);
      assert.equal(second.status, 0, second.stderr);
      const b = JSON.parse(readFileSync(path.join(dir, "valid-full.json"), "utf8"));
      assert.equal(a.hash, b.hash);
      assert.deepEqual(a.variables.data.tags, { connect: [{ id: "t1" }, { id: "t2" }] });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
