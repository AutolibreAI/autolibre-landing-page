import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getOpenStatus,
  type HoursDay,
  type OpenStatus,
} from "../../../lib/provider-profile/open-status.ts";
import fixture from "../../../specs/209-public-provider-profile/contracts/fixtures/open-status-cases.json" with { type: "json" };

type Case = {
  readonly name: string;
  readonly now: string;
  readonly hours?: readonly HoursDay[] | null;
  readonly expected: OpenStatus;
};

// La misma fixture la debe pasar la app móvil (riesgo R3).
for (const testCase of fixture.cases as readonly Case[]) {
  test(testCase.name, () => {
    const hours =
      "hours" in testCase ? testCase.hours : (fixture.baseHours as readonly HoursDay[]);
    assert.deepEqual(getOpenStatus(hours, new Date(testCase.now)), testCase.expected);
  });
}
