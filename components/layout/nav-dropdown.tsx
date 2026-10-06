"use client";

import { useEffect, useId, useRef, useState } from "react";
import { navEntryClass, navEntryCurrentClass } from "@/components/layout/nav-styles";
import { cn } from "@/lib/utils";

type NavDropdownProps = {
  /** Texto del botón (el label del grupo). */
  readonly label: string;
  /**
   * El grupo contiene la página actual: el botón se marca con subrayado
   * además del color (el color solo no alcanza, WCAG 1.4.1).
   */
  readonly containsCurrent?: boolean;
  /**
   * Clases extra del panel. Por defecto mide `w-80`; un grupo con íconos y
   * descripciones (Servicios) lo ensancha para que cada descripción entre en
   * una sola línea.
   */
  readonly panelClassName?: string;
  /** La lista de links, renderizada en el server. */
  readonly children: React.ReactNode;
};

/**
 * Evento con el que un desplegable avisa que se abrió, para que los demás se
 * cierren. Un evento del DOM y no un contexto de React: así el `<ul>` de
 * grupos sigue siendo HTML del server y no hace falta un provider client
 * envolviéndolo.
 */
const OPEN_EVENT = "site-nav:open";

/**
 * Desplegable del nav principal con el patrón "disclosure navigation" (un
 * `<button>` con `aria-expanded` que muestra y oculta una lista de links).
 * NO es `role="menu"`: eso es para menús de aplicación, cambia cómo los
 * lectores de pantalla anuncian y recorren los items y obliga a manejar las
 * flechas. Acá los links se recorren con Tab, como cualquier link.
 *
 * Es la única parte del nav que se hidrata. Los links llegan como `children`
 * ya renderizados en el server: están en el HTML inicial (indexables) y el
 * panel sólo cambia de visible a invisible.
 *
 * Se cierra con Escape (y devuelve el foco al botón), con un click afuera,
 * cuando el foco sale del grupo, al elegir un link y cuando se abre otro
 * desplegable. Abre con click o teclado; el hover en mouse es una mejora,
 * no un requisito.
 */
export function NavDropdown({
  label,
  containsCurrent = false,
  panelClassName,
  children,
}: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  /**
   * Se abrió por hover: al salir el mouse se cierra solo. Si después el
   * usuario hace click, el click lo "fija" en lugar de cerrarlo (si no, el
   * primer click sobre un desplegable ya abierto por hover lo cerraba).
   */
  const openedByHover = useRef(false);
  const panelId = useId();

  function show(byHover: boolean) {
    openedByHover.current = byHover;
    setOpen(true);
    document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: panelId }));
  }

  function hide() {
    openedByHover.current = false;
    setOpen(false);
  }

  // Cerrarse cuando se abre otro desplegable del nav.
  useEffect(() => {
    function onOtherOpen(event: Event) {
      if ((event as CustomEvent<string>).detail !== panelId) {
        openedByHover.current = false;
        setOpen(false);
      }
    }
    document.addEventListener(OPEN_EVENT, onOtherOpen);
    return () => document.removeEventListener(OPEN_EVENT, onOtherOpen);
  }, [panelId]);

  // Click (o toque) afuera del grupo. `pointerdown` y no `click`: cierra
  // antes de que el otro elemento reciba el foco o el click.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        openedByHover.current = false;
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Escape cierra. Escucha en `document` y no en el grupo para cubrir también
  // el panel abierto por hover con el foco en otro lado. El foco vuelve al
  // botón sólo si estaba adentro del grupo: si no, no se lo robamos a nadie.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const focusInside = rootRef.current?.contains(document.activeElement);
      openedByHover.current = false;
      setOpen(false);
      if (focusInside) buttonRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        // El foco salió del grupo (Tab desde el último link, o Shift+Tab
        // desde el botón). `relatedTarget` es null si se fue de la página.
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
          hide();
        }
      }}
      onClick={(event) => {
        // Elegir un link cierra el panel (también si es la página actual).
        if ((event.target as HTMLElement).closest("a")) hide();
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse" && !open) show(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse" && openedByHover.current) hide();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (open && openedByHover.current) {
            openedByHover.current = false;
            return;
          }
          if (open) hide();
          else show(false);
        }}
        className={cn(
          navEntryClass,
          "aria-expanded:text-ink",
          containsCurrent && navEntryCurrentClass,
        )}
      >
        {label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn(
            "transition-transform motion-reduce:transition-none",
            open && "rotate-180",
          )}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/*
        Cerrado queda `invisible` (visibility: hidden): fuera del orden de
        Tab y del árbol de accesibilidad, pero en el HTML. El `pt-2` es un
        puente sin hueco entre el botón y el panel, para que el hover no se
        corte al bajar el mouse. Con `prefers-reduced-motion` aparece sin
        fundido ni desplazamiento.
      */}
      <div
        id={panelId}
        className={cn(
          "absolute top-full left-0 z-50 pt-2 transition-[opacity,translate,visibility] duration-150 motion-reduce:transition-none",
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1 opacity-0",
        )}
      >
        <div
          className={cn(
            "w-80 rounded-card border border-line bg-surface p-2 shadow-lg",
            panelClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
