"use client";

import { useRef, useState } from "react";
import {
  ANALYTICS_EVENTS,
  type QuoteModulePlacement,
  type QuoteTab,
} from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";

export type ModuloTab = {
  readonly id: QuoteTab;
  readonly label: string;
  /** Ícono decorativo ya renderizado en el server (`next/image`, `alt=""`). */
  readonly icon: React.ReactNode;
  /** Contenido del panel, renderizado en el server (o una isla hoja). */
  readonly panel: React.ReactNode;
};

type ModuloTabsProps = {
  /** Prefijo de los ids (un módulo por página, pero dos no chocarían). */
  readonly idPrefix: string;
  readonly label: string;
  readonly placement: QuoteModulePlacement;
  readonly tabs: readonly ModuloTab[];
};

/**
 * Pestañas del módulo de pedido: patrón de tabs de la APG (W3C) con
 * activación automática (los paneles ya están en el DOM, cambiar no tiene
 * demora).
 *
 * - `role="tablist"` / `tab` / `tabpanel`, `aria-selected`, `aria-controls` y
 *   `aria-labelledby` cruzados.
 * - Roving tabindex: solo la pestaña elegida entra al orden de Tab; ←/→ se
 *   mueven (y eligen) en círculo, Inicio/Fin van a la primera/última.
 * - Todos los paneles (Taller, Auxilio, Multas, Seguros, Financiación) salen
 *   en el HTML del server; los no elegidos con
 *   `hidden`. Nada aparece recién al hidratar, y el estado inicial (Taller)
 *   es el mismo en el server y en el cliente: sin CLS.
 *
 * Con cinco pestañas la fila no entra en un celular: cada pestaña mide lo que
 * su texto (nunca se corta "Financiación") y la fila scrollea de costado, con
 * la última asomando para que se note. Si entra, queda centrada
 * (`mx-auto w-fit max-w-full`). El foco con flechas trae la pestaña a la vista.
 *
 * Isla chica a propósito: los íconos, los textos y los paneles llegan como
 * props ya renderizados. Acá vive solo qué pestaña está elegida.
 */
export function ModuloTabs({ idPrefix, label, placement, tabs }: ModuloTabsProps) {
  const [selected, setSelected] = useState<QuoteTab>(tabs[0].id);
  const tabRefs = useRef<Partial<Record<QuoteTab, HTMLButtonElement | null>>>({});

  const tabId = (id: QuoteTab) => `${idPrefix}-tab-${id}`;
  const panelId = (id: QuoteTab) => `${idPrefix}-panel-${id}`;

  function select(id: QuoteTab) {
    if (id === selected) return;
    setSelected(id);
    track(ANALYTICS_EVENTS.quoteTabSelected, { tab: id, placement });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    const target =
      event.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : event.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (target === null) return;
    event.preventDefault();
    const next = tabs[target].id;
    select(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        // `p-1`: lugar para el anillo de foco, que el scroll recortaría.
        className="mx-auto flex w-fit max-w-full gap-1 overflow-x-auto p-1 sm:gap-4 lg:gap-7"
      >
        {tabs.map((tab, index) => {
          const isSelected = tab.id === selected;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              type="button"
              role="tab"
              id={tabId(tab.id)}
              aria-selected={isSelected}
              aria-controls={panelId(tab.id)}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => select(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                // Objetivo táctil: todo el botón (ícono + texto), mínimo 44px.
                "flex min-h-11 min-w-18 flex-none flex-col items-center gap-1.5 border-b-3 px-2 pt-2 pb-2.5 whitespace-nowrap transition-colors motion-reduce:transition-none sm:min-w-24",
                isSelected
                  ? "border-action text-fg"
                  : "border-transparent text-fg-muted hover:border-control-line",
              )}
            >
              {tab.icon}
              <span className="font-display text-control font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={panelId(tab.id)}
          aria-labelledby={tabId(tab.id)}
          hidden={tab.id !== selected}
          className="mx-auto mt-5 max-w-230"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
