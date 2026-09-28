import { schedulePostHogLoad } from "@/lib/analytics/posthog";

/**
 * Corre antes de hidratar (convención de Next ≥ 15.3). NO inicializa PostHog
 * acá mismo: sólo programa la carga para después del `load` y en idle, así
 * `posthog-js` nunca compite con el LCP ni con la hidratación. Sin
 * `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` es no-op. Ver `lib/analytics/posthog.ts`.
 *
 * Único punto de init del lado del cliente: nada de `PostHogProvider`.
 */
try {
  schedulePostHogLoad();
} catch {
  // La medición nunca rompe la página.
}
