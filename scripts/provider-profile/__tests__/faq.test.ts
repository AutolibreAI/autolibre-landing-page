import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildFaq,
  MAX_FAQ_ITEMS,
  type FaqItem,
  type FaqProfile,
  type FaqTemplates,
} from "../../../lib/provider-profile/faq.ts";
import fixture from "../../../specs/209-public-provider-profile/contracts/fixtures/faq-cases.json" with { type: "json" };

type Case = {
  readonly name: string;
  readonly profile: FaqProfile;
  readonly expected: readonly FaqItem[];
};

const templates = fixture.templates as unknown as FaqTemplates;

// La misma fixture la debe pasar la app móvil (riesgo R3).
for (const testCase of fixture.cases as unknown as readonly Case[]) {
  test(testCase.name, () => {
    assert.deepEqual(buildFaq(testCase.profile, templates), testCase.expected);
  });
}

test("el tope total es de 8 preguntas", () => {
  for (const testCase of fixture.cases as unknown as readonly Case[]) {
    assert.ok(buildFaq(testCase.profile, templates).length <= MAX_FAQ_ITEMS);
  }
});

test("nunca hay una pregunta negativa por una marca no declarada", () => {
  for (const testCase of fixture.cases as unknown as readonly Case[]) {
    for (const item of buildFaq(testCase.profile, templates)) {
      if (item.id.startsWith("brands-")) {
        assert.ok(item.answer.startsWith("Sí"), `${item.id}: ${item.answer}`);
      }
    }
  }
});
