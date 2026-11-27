"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  announceHeaderDisclosure,
  onOtherHeaderDisclosure,
} from "@/lib/navigation/header-disclosure";
import { cn } from "@/lib/utils";

type HeaderNavSubmenuProps = {
  /** Id del panel: lo referencia el `aria-controls` del botón. */
  readonly panelId: string;
  /** Nombre accesible del botón de la flecha (sale de `lib/content/site.ts`). */
  readonly toggleLabel: string;
  /**
   * El link de sección ("Proveedores"), renderizado por el header. Viaja como
   * prop y se monta junto a hermanos: tiene que traer `key` (AGENTS.md §1).
   */
  readonly link: React.ReactNode;
  /** La lista de sublinks, renderizada por el header (Server Component). */
  readonly children: React.ReactNode;
};

/**
 * Gracia antes de cerrar cuando el puntero sale: evita que el panel parpadee
 * si el mouse roza el borde o cruza en diagonal hacia un sublink.
 */
const CLOSE_DELAY_MS = 150;

/**
 * Submenú de un link de sección del header (hoy solo "Proveedores"), desde
 * `lg`. Debajo de `lg` los mismos links están en el panel de
 * `HeaderAccountMenu`.
 *
 * La isla es solo el comportamiento: el link de sección y la lista de
 * sublinks los renderiza el header en el server y llegan como `link` y
 * `children`. El panel está SIEMPRE en el DOM (cerrado va con `hidden`), así
 * los sublinks salen en el HTML inicial como links internos indexables.
 *
 * Patrón ARIA: DISCLOSURE de navegación de la APG, igual que
 * `HeaderAccountMenu` (ahí está el porqué de no usar `role="menu"`). El label
 * sigue siendo un link que navega; al lado, un botón con `aria-expanded` y
 * `aria-controls` abre y cierra el panel.
 *
 * Abierto o cerrado es UN estado de React, no CSS (`:hover` /
 * `:focus-within`): con CSS el panel se vería abierto con
 * `aria-expanded="false"` y no habría forma de cerrarlo con Escape mientras
 * el puntero sigue encima (WCAG 1.4.13). El costo: antes de hidratar el hover
 * no abre nada; el link de sección igual navega.
 *
 * Se abre:
 * - Con el mouse encima del link, del botón o del panel (el toque no cuenta
 *   como hover: en una tablet a ancho `lg` se abre con el botón).
 * - Cuando el foco de TECLADO entra desde afuera (`:focus-visible`). El foco
 *   que deja un click o un toque no abre: si abriera, ese mismo click sobre
 *   el botón lo cerraría enseguida.
 * - Con el botón. Con el mouse encima el panel ya está abierto por hover, así
 *   que el click no lo cierra (sería un parpadeo); con teclado o toque alterna.
 *
 * Se cierra:
 * - Con Escape, también si lo abrió el hover; el foco vuelve al botón solo si
 *   estaba adentro. No se reabre hasta que el puntero salga y vuelva a entrar.
 * - Cuando el puntero sale, tras `CLOSE_DELAY_MS`, salvo que el foco de
 *   teclado siga adentro.
 * - Con un click o toque afuera, cuando el foco sale, al elegir un link y
 *   cuando se abre el menú de cuenta (un solo panel del header a la vez).
 *
 * WCAG 1.4.13: descartable (Escape), "hoverable" (el hueco entre el link y la
 * tarjeta es `padding` del panel, no `margin`: el puntero nunca sale de la
 * isla al bajar) y persistente (no se cierra solo).
 */
export function HeaderNavSubmenu({ panelId, toggleLabel, link, children }: HeaderNavSubmenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  /** El mouse está encima de la isla. */
  const hoverRef = useRef(false);
  const closeTimerRef = useRef<number | undefined>(undefined);

  function cancelClose() {
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = undefined;
  }

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  useEffect(() => {
    if (!open) return;

    announceHeaderDisclosure(panelId);
    const stopListening = onOtherHeaderDisclosure(panelId, () => setOpen(false));

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const focusInside = rootRef.current?.contains(document.activeElement) ?? false;
      setOpen(false);
      // Antes del re-render: el sublink todavía se puede enfocar, así que el
      // `focus` del botón llega con `relatedTarget` adentro y no reabre.
      if (focusInside) buttonRef.current?.focus();
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      stopListening();
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, panelId]);

  function onPointerEnter(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    hoverRef.current = true;
    cancelClose();
    setOpen(true);
  }

  function onPointerLeave(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    hoverRef.current = false;
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      // Con el foco de teclado adentro no se cierra: escondería lo enfocado.
      if (!rootRef.current?.querySelector(":focus-visible")) setOpen(false);
    }, CLOSE_DELAY_MS);
  }

  function onFocus(event: React.FocusEvent<HTMLDivElement>) {
    const from = event.relatedTarget;
    if (from instanceof Node && event.currentTarget.contains(from)) return;
    if (!event.target.matches(":focus-visible")) return;
    cancelClose();
    setOpen(true);
  }

  function onBlur(event: React.FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    // `null` (el foco se fue a la nada): lo maneja el click afuera.
    if (next instanceof Node && !event.currentTarget.contains(next)) setOpen(false);
  }

  function onClick(event: React.MouseEvent<HTMLDivElement>) {
    // Delegado: los links son markup del server y no traen handlers. El de
    // sección también cierra (navega a otra página con el mismo header).
    if ((event.target as Element).closest("a")) {
      cancelClose();
      setOpen(false);
    }
  }

  function onToggle(event: React.MouseEvent<HTMLButtonElement>) {
    cancelClose();
    // `detail === 0`: el click vino del teclado (Enter o Espacio).
    const keepOpen = event.detail !== 0 && hoverRef.current;
    setOpen((value) => (keepOpen ? true : !value));
  }

  return (
    <div
      ref={rootRef}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={onClick}
      className="relative flex items-center"
    >
      {link}
      {/* 44px de área táctil sin separar la flecha del label ni mover al link
          que sigue: la flecha va pegada a la izquierda y el resto de la caja
          se mete en el espacio entre links (`gap-7` de la lista). */}
      <button
        ref={buttonRef}
        type="button"
        aria-label={toggleLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="-mr-5.5 flex size-11 items-center pl-1.5 text-fg-muted transition-colors hover:text-fg motion-reduce:transition-none"
      >
        <Icon
          name="chevron-down"
          size={16}
          strokeWidth={2}
          className={cn(
            "transition-transform motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>

      {/* `z-40` dentro del header (`z-50`), como el panel de cuenta (ver
          `WhatsappFab`). `pt-1.5` es el puente del hover: mismo hueco que el
          `mt-1.5` del desplegable de cuenta, pero en `padding`. `-left-5`
          alinea el texto de los sublinks con el label: compensa el `p-2` de
          la tarjeta más el `px-3` de cada fila (las filas van "inset", ver
          `SiteHeader`). `w-120` (30rem): la bajada más larga entra en una
          línea junto a la tilde de la página actual (401px de texto en 414
          disponibles); a 1024px el panel termina cerca de los 695px. */}
      <div id={panelId} hidden={!open} className="absolute top-full -left-5 z-40 pt-1.5">
        <div className="w-120 rounded-card border border-control-line bg-card p-2 shadow-popover">
          {children}
        </div>
      </div>
    </div>
  );
}
