import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_METRIC_THRESHOLDS,
  selectVisibleMetrics,
  type MetricThresholds,
  type MetricsInput,
} from "../../../lib/provider-profile/metrics.ts";

const metrics: MetricsInput = {
  responseTimeMinutes: 45,
  responseRate: 0.9,
  proposalsSent: 34,
};

const thresholds: MetricThresholds = {
  responseTimeMaxMinutes: 60,
  responseRateMin: 0.8,
  proposalsSentMin: 20,
};

test("con los umbrales por defecto (null) no se muestra ninguna", () => {
  assert.deepEqual(selectVisibleMetrics(metrics, DEFAULT_METRIC_THRESHOLDS), []);
  assert.deepEqual(selectVisibleMetrics(metrics), []);
});

test("una métrica con umbral null no se muestra aunque tenga dato", () => {
  assert.deepEqual(
    selectVisibleMetrics(metrics, { ...thresholds, responseRateMin: null }).map((m) => m.kind),
    ["responseTime", "proposalsSent"],
  );
});

test("sin dato no se muestra", () => {
  assert.deepEqual(
    selectVisibleMetrics(
      { responseTimeMinutes: null, responseRate: null, proposalsSent: null },
      thresholds,
    ),
    [],
  );
  assert.deepEqual(selectVisibleMetrics(null, thresholds), []);
});

test("con umbrales definidos se muestran solo las que los superan", () => {
  const result = selectVisibleMetrics(
    { responseTimeMinutes: 90, responseRate: 0.9, proposalsSent: 5 },
    thresholds,
  );
  assert.deepEqual(result, [{ kind: "responseRate", rate: 0.9 }]);
});

test("el borde del umbral cuenta como superado", () => {
  const result = selectVisibleMetrics(
    { responseTimeMinutes: 60, responseRate: 0.8, proposalsSent: 20 },
    thresholds,
  );
  assert.equal(result.length, 3);
});
