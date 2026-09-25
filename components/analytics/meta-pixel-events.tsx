"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  META_EVENTS,
  META_LEAD_SOURCES,
  trackMetaEvent,
  type MetaEventName,
} from "@/lib/analytics/meta-pixel";

const TRACKABLE_EVENTS = new Set<string>(Object.values(META_EVENTS));
const LEAD_SOURCES = new Set<string>(Object.values(META_LEAD_SOURCES));

/**
 * Isla hoja del Meta Pixel. No renderiza nada: sólo engancha dos cosas que
 * el stub inline del layout no puede ver.
 *
 * - `PageView` en cada navegación del router. El de la carga inicial ya lo
 *   mandó el stub, así que el primer pathname se saltea. Sólo `usePathname`
 *   y NO `useSearchParams`: éste obliga a un `<Suspense>` y hace bailout a
 *   CSR, y los cambios de query no son páginas nuevas.
 * - UN listener delegado de click: cualquier elemento con
 *   `data-meta-event="Contact"` (o otro nombre de `META_EVENTS`) lo manda al
 *   Pixel. Así los links medidos siguen siendo Server Components. En captura
 *   para que un `stopPropagation` ajeno no se coma el evento. Tres atributos
 *   opcionales suman params: `data-meta-placement="hero"` → `placement`
 *   (qué ubicación del CTA convirtió), `data-meta-pedido` → `pedido: true`
 *   (el click vino después de dejar un pedido) y
 *   `data-meta-lead-source="whatsapp"` → `lead_source` (de qué camino vino
 *   el `Lead`; sólo valores de `META_LEAD_SOURCES`, el resto se ignora para
 *   que un typo no abra una fuente nueva en los reportes). Nunca datos
 *   personales.
 */
export function MetaPixelEvents() {
  const pathname = usePathname();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    trackMetaEvent(META_EVENTS.pageView);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const el = event.target.closest<HTMLElement>("[data-meta-event]");
      const name = el?.dataset.metaEvent;
      if (!el || !name || !TRACKABLE_EVENTS.has(name)) return;

      const params: Record<string, string | boolean> = {};
      const placement = el.dataset.metaPlacement;
      if (placement) params.placement = placement;
      if (el.dataset.metaPedido !== undefined) params.pedido = true;
      const leadSource = el.dataset.metaLeadSource;
      if (leadSource && LEAD_SOURCES.has(leadSource)) {
        params.lead_source = leadSource;
      }

      trackMetaEvent(
        name as MetaEventName,
        Object.keys(params).length > 0 ? params : undefined,
      );
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
