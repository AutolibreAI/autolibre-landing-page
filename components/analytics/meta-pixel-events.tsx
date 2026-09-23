"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { META_EVENTS, trackMetaEvent, type MetaEventName } from "@/lib/analytics/meta-pixel";

const TRACKABLE_EVENTS = new Set<string>(Object.values(META_EVENTS));

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
 *   para que un `stopPropagation` ajeno no se coma el evento.
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
      if (name && TRACKABLE_EVENTS.has(name)) trackMetaEvent(name as MetaEventName);
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
