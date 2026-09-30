import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { blockReason, parsePlan } from "../lib/plan.ts";
import { fixture, loadPlan } from "./helpers.ts";

function post(slug: string, status = "planned", priority = "P1"): string {
  return [
    `  - slug: ${slug}`,
    `    title: "T"`,
    `    category: c`,
    `    tags: []`,
    `    priority: ${priority}`,
    `    sourceIds: [DOC-01]`,
    `    status: ${status}`,
    "",
  ].join("\n");
}

describe("plan.yaml", () => {
  it("parsea el fixture", () => {
    const { plan, errors } = parsePlan(fixture("plan.yaml"));
    assert.deepEqual(errors, []);
    assert.equal(plan!.posts.length, 3);
    assert.equal(plan!.posts[2]!.blockedBy, "VTV-07 está en contradicción en la fuente");
  });

  it("P1-S1: slug duplicado → error", () => {
    const { plan, errors } = parsePlan(`version: 1\nposts:\n${post("a")}${post("a")}`);
    assert.equal(plan, null);
    assert.ok(errors.some((e) => /slug duplicado/.test(e)));
  });

  it("rechaza status y prioridad inválidos", () => {
    const { errors } = parsePlan(`version: 1\nposts:\n${post("a", "done", "P9")}`);
    assert.equal(errors.length, 2);
  });

  it("P1-S2: blockedBy frena el avance con el motivo", () => {
    const plan = loadPlan();
    assert.equal(blockReason(plan, "valid-full"), null);
    assert.match(blockReason(plan, "vtv-caba")!, /bloqueado: VTV-07 está en contradicción/);
    assert.match(blockReason(plan, "no-existe")!, /no está en plan.yaml/);
  });
});
