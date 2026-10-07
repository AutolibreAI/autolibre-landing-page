/**
 * Métricas "Medido por AutoLibre" que se muestran (`data-model.md §3.8`).
 * Módulo PURO: sin imports.
 *
 * Cada métrica se muestra SOLO si supera su umbral, calculado con una regla
 * determinística (sin LLM). Los umbrales son `null` hasta que producto los
 * defina: una métrica con umbral `null`, o sin dato, no se muestra. Con cero
 * métricas visibles, el bloque entero se omite.
 */

export type MetricsInput = {
  readonly responseTimeMinutes: number | null;
  /** 0–1. */
  readonly responseRate: number | null;
  readonly proposalsSent: number | null;
};

export type MetricThresholds = {
  /** Tiempo de respuesta máximo (en minutos) para mostrarlo: menor o igual. */
  readonly responseTimeMaxMinutes: number | null;
  /** Tasa de respuesta mínima (0–1) para mostrarla: mayor o igual. */
  readonly responseRateMin: number | null;
  /** Cantidad mínima de propuestas enviadas para mostrarlas. */
  readonly proposalsSentMin: number | null;
};

export type VisibleMetric =
  | { readonly kind: "responseTime"; readonly minutes: number }
  | { readonly kind: "responseRate"; readonly rate: number }
  | { readonly kind: "proposalsSent"; readonly count: number };

/** Hasta que producto defina los umbrales, ninguna métrica se muestra. */
export const DEFAULT_METRIC_THRESHOLDS: MetricThresholds = {
  responseTimeMaxMinutes: null,
  responseRateMin: null,
  proposalsSentMin: null,
};

export function selectVisibleMetrics(
  metrics: MetricsInput | null | undefined,
  thresholds: MetricThresholds = DEFAULT_METRIC_THRESHOLDS,
): readonly VisibleMetric[] {
  if (!metrics) return [];
  const visible: VisibleMetric[] = [];

  const { responseTimeMinutes, responseRate, proposalsSent } = metrics;
  const { responseTimeMaxMinutes, responseRateMin, proposalsSentMin } = thresholds;

  if (
    responseTimeMinutes !== null &&
    responseTimeMaxMinutes !== null &&
    responseTimeMinutes <= responseTimeMaxMinutes
  ) {
    visible.push({ kind: "responseTime", minutes: responseTimeMinutes });
  }
  if (
    responseRate !== null &&
    responseRateMin !== null &&
    responseRate >= responseRateMin
  ) {
    visible.push({ kind: "responseRate", rate: responseRate });
  }
  if (
    proposalsSent !== null &&
    proposalsSentMin !== null &&
    proposalsSent >= proposalsSentMin
  ) {
    visible.push({ kind: "proposalsSent", count: proposalsSent });
  }
  return visible;
}
