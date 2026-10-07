"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  APP_STORES,
  CLICKABLE_EVENTS,
  LEAD_SOURCES,
  PROVIDER_ACTIONS,
  QUOTE_CTA_PLACEMENTS,
  type AnalyticsEventName,
  type AnalyticsProps,
} from "@/lib/analytics/events";
import { META_PIXEL_ID, trackMetaPageView } from "@/lib/analytics/meta-pixel";
import { parseProviderAction, parseProviderAttr } from "@/lib/analytics/provider-attrs";
import { trackUnchecked } from "@/lib/analytics/track";

const LEAD_SOURCE_VALUES = new Set<string>(Object.values(LEAD_SOURCES));
const STORE_VALUES = new Set<string>(Object.values(APP_STORES));
const PROVIDER_ACTION_VALUES = new Set<string>(Object.values(PROVIDER_ACTIONS));
const QUOTE_CTA_PLACEMENT_VALUES = new Set<string>(
  Object.values(QUOTE_CTA_PLACEMENTS),
);

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
 *   - `data-analytics-quote-placement="hero"` → `placement` de
 *     `quote_cta_clicked` (CTA de presupuesto). Sólo acepta los valores de
 *     `QUOTE_CTA_PLACEMENTS`.
 *   - `data-analytics-provider="mecanica-barrancas"` → `provider` (slug del
 *     perfil; si no tiene formato de slug, se omite).
 *   - `data-analytics-action="call"` → `action` de `provider_action_clicked`.
 *   `lead_source`, `store`, `action` y el `placement` de presupuesto sólo aceptan los
 *   valores del catálogo; el resto se ignora para que un typo no abra una
 *   fuente nueva en los reportes.
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
      const quotePlacement = el.dataset.analyticsQuotePlacement;
      if (quotePlacement && QUOTE_CTA_PLACEMENT_VALUES.has(quotePlacement)) {
        props.placement = quotePlacement;
      }
      if (el.dataset.analyticsPedido !== undefined) props.pedido = true;
      const leadSource = el.dataset.analyticsLeadSource;
      if (leadSource && LEAD_SOURCE_VALUES.has(leadSource)) {
        props.lead_source = leadSource;
      }
      const provider = parseProviderAttr(el.dataset.analyticsProvider);
      if (provider) props.provider = provider;
      const action = parseProviderAction(
        el.dataset.analyticsAction,
        PROVIDER_ACTION_VALUES,
      );
      if (action) props.action = action;
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
