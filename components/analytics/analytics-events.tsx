"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  APP_STORES,
  CLICKABLE_EVENTS,
  LEAD_SOURCES,
  type AnalyticsEventName,
  type AnalyticsProps,
} from "@/lib/analytics/events";
import { META_PIXEL_ID, trackMetaPageView } from "@/lib/analytics/meta-pixel";
import { trackUnchecked } from "@/lib/analytics/track";

const LEAD_SOURCE_VALUES = new Set<string>(Object.values(LEAD_SOURCES));
const STORE_VALUES = new Set<string>(Object.values(APP_STORES));

/**
 * Isla hoja de la medición. No renderiza nada: sólo engancha dos cosas que
 * un Server Component no puede hacer.
 *
 * - `PageView` de Meta en cada navegación del router. El de la carga inicial
 *   ya lo mandó el stub del layout, así que el primer pathname se saltea.
 *   Sólo `usePathname` y NO `useSearchParams`: éste obliga a un `<Suspense>`
 *   y hace bailout a CSR, y los cambios de query no son páginas nuevas.
 *   PostHog NO pasa por acá: cuenta sus pageviews solo
 *   (`capture_pageview: "history_change"`, ver `lib/analytics/posthog.ts`).
 * - UN listener delegado de click: cualquier elemento con
 *   `data-analytics-event="whatsapp_clicked"` (o otro evento marcado
 *   `clickable` en el catálogo de `lib/analytics/events.ts`) sale por
 *   `track()` a PostHog y a Meta. Así los links medidos siguen siendo Server
 *   Components. En captura para que un `stopPropagation` ajeno no se coma el
 *   evento. Atributos opcionales que suman props:
 *   - `data-analytics-placement="hero"` → `placement` (qué ubicación del CTA
 *     convirtió).
 *   - `data-analytics-pedido` → `pedido: true` (el click vino después de
 *     dejar un pedido).
 *   - `data-analytics-lead-source="whatsapp"` → `lead_source` (de qué camino
 *     vino el `Lead`).
 *   - `data-analytics-store="app_store"` → `store`.
 *   `lead_source` y `store` sólo aceptan los valores del catálogo; el resto
 *   se ignora para que un typo no abra una fuente nueva en los reportes.
 *   Nunca datos personales.
 */
export function AnalyticsEvents() {
  const pathname = usePathname();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    if (META_PIXEL_ID) trackMetaPageView();
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const el = event.target.closest<HTMLElement>("[data-analytics-event]");
      const name = el?.dataset.analyticsEvent;
      if (!el || !name || !CLICKABLE_EVENTS.has(name)) return;

      const props: AnalyticsProps = {};
      const placement = el.dataset.analyticsPlacement;
      if (placement) props.placement = placement;
      if (el.dataset.analyticsPedido !== undefined) props.pedido = true;
      const leadSource = el.dataset.analyticsLeadSource;
      if (leadSource && LEAD_SOURCE_VALUES.has(leadSource)) {
        props.lead_source = leadSource;
      }
      const store = el.dataset.analyticsStore;
      if (store && STORE_VALUES.has(store)) props.store = store;

      trackUnchecked(
        name as AnalyticsEventName,
        Object.keys(props).length > 0 ? props : undefined,
      );
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
