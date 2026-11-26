"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

type FiltersToggleProps = {
  readonly label: string;
  /** `id` del panel con zona, rubro y "Buscar". */
  readonly controls: string;
  /** Abierto de entrada (hay zona o rubro elegidos): lo decide el server. */
  readonly initiallyOpen: boolean;
};

/**
 * Botón "Filtros" del buscador en celular (debajo de `md`): muestra u oculta
 * zona, rubro y "Buscar". Isla hoja: marca el `<form>` con
 * `data-filters-open` y el CSS hace el resto (el panel es del server). Desde
 * `md` el botón no se ve y el panel va siempre en línea.
 */
export function FiltersToggle({ label, controls, initiallyOpen }: FiltersToggleProps) {
  const [open, setOpen] = useState(initiallyOpen);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (form) form.dataset.filtersOpen = String(open);
  }, [open]);

  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      aria-label={label}
      title={label}
      onClick={() => setOpen((value) => !value)}
      className="flex size-13 shrink-0 items-center justify-center rounded-full border border-control-line-strong bg-card text-fg transition-colors hover:border-fg-muted aria-expanded:border-action aria-expanded:bg-brand-50 motion-reduce:transition-none md:hidden"
    >
      <Icon name="filter" size={20} strokeWidth={2} />
    </button>
  );
}
