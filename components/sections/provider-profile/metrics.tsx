import { ProfileCard } from "@/components/ui/profile-card";
import {
  fillTemplate,
  providerProfileContent as copy,
} from "@/lib/content/provider-profile";
import {
  DEFAULT_METRIC_THRESHOLDS,
  selectVisibleMetrics,
  type VisibleMetric,
} from "@/lib/provider-profile/metrics";
import type { PartnerProfile } from "@/lib/provider-profile/types";

function metricLabel(metric: VisibleMetric): { label: string; value: string } {
  switch (metric.kind) {
    case "responseTime":
      return {
        label: copy.metrics.responseTime,
        value: fillTemplate(copy.metrics.responseTimeValue, { minutes: metric.minutes }),
      };
    case "responseRate":
      return { label: copy.metrics.responseRate, value: `${Math.round(metric.rate * 100)}%` };
    case "proposalsSent":
      return { label: copy.metrics.proposalsSent, value: String(metric.count) };
  }
}

/**
 * "Medido por AutoLibre": cada métrica se muestra SOLO si supera su umbral
 * (regla determinística, sin LLM). Los umbrales son `null` hasta que producto
 * los defina, así que hoy no se muestra ninguna y el bloque entero no existe.
 * Bajada fija: "Solo se muestran los datos que superan nuestro estándar."
 */
export function MetricsSection({ profile }: { readonly profile: PartnerProfile }) {
  const visible = selectVisibleMetrics(profile.metrics, DEFAULT_METRIC_THRESHOLDS);
  if (visible.length === 0) return null;

  return (
    <ProfileCard id="perfil-metricas" title={copy.sections.metrics} className="mt-5">
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        {visible.map((metric) => {
          const { label, value } = metricLabel(metric);
          return (
            <div key={metric.kind} className="rounded-xl bg-card-muted p-4">
              <dt className="text-sm text-ink/65">{label}</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-ink">{value}</dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-3 text-sm text-ink/60">{copy.metrics.footnote}</p>
    </ProfileCard>
  );
}
