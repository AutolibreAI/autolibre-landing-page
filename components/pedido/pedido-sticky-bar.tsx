"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FORM_TOGGLE_EVENT, PEDIDO_IDS, type FormToggleDetail } from "./shared";

type PedidoStickyBarProps = {
  /** Etiqueta del landmark. */
  readonly label: string;
  /** Los CTAs, renderizados por el server: esta isla solo decide si se ven. */
  readonly children: React.ReactNode;
};

/**
 * Barra fija inferior de `/pedido` en mobile (`lg:hidden`). Isla mínima: los
 * botones llegan como `children` desde el server; acá solo vive la lógica de
 * cuándo mostrarla, con IntersectionObserver (nada de escuchar el scroll).
 *
 * Aparece cuando los CTAs del hero ya quedaron ARRIBA de la pantalla, y se
 * esconde cuando se ve la banda de cierre o el footer (que ya traen sus
 * propios CTAs y no tienen que quedar tapados) y mientras la vista del form
 * está abierta. Oculta = `inert`: fuera del orden de tabulación y del árbol de
 * accesibilidad. Sin JS o sin IntersectionObserver, nunca aparece.
 */
export function PedidoStickyBar({ label, children }: PedidoStickyBarProps) {
  const [pastHero, setPastHero] = useState(false);
  const [endVisible, setEndVisible] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(PEDIDO_IDS.heroCtas);
    if (!hero || !("IntersectionObserver" in window)) return;

    const heroObserver = new IntersectionObserver(([entry]) => {
      // Solo "pasados": por encima del viewport, no todavía por debajo.
      setPastHero(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });
    heroObserver.observe(hero);

    const endVisibility = new Map<Element, boolean>();
    const endObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) endVisibility.set(entry.target, entry.isIntersecting);
      setEndVisible(Array.from(endVisibility.values()).some(Boolean));
    });
    for (const id of [PEDIDO_IDS.ctaBand, PEDIDO_IDS.footer]) {
      const el = document.getElementById(id);
      if (el) endObserver.observe(el);
    }

    function onFormToggle(event: Event) {
      setFormOpen(Boolean((event as CustomEvent<FormToggleDetail>).detail?.open));
    }
    window.addEventListener(FORM_TOGGLE_EVENT, onFormToggle);

    return () => {
      heroObserver.disconnect();
      endObserver.disconnect();
      window.removeEventListener(FORM_TOGGLE_EVENT, onFormToggle);
    };
  }, []);

  const visible = pastHero && !endVisible && !formOpen;

  return (
    <aside
      aria-label={label}
      inert={!visible}
      className={cn(
        // `calc` con `env()`: no hay utility canónica para sumar el área
        // segura del iPhone (la barra del home no puede tapar los botones).
        // `px-[6%]`: el gutter de `Container`, alineado con la página.
        "fixed inset-x-0 bottom-0 z-40 flex flex-col gap-1 border-t border-line bg-surface px-[6%] pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition duration-300 ease-out motion-reduce:transition-none lg:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      {children}
    </aside>
  );
}
