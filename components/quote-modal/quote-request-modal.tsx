"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { QuoteFlow } from "@/components/quote-flow";
import { presupuestoContent } from "@/lib/content/presupuesto";
import type { VariantProps } from "class-variance-authority";

const copy = presupuestoContent.modal;

type QuoteRequestModalProps = VariantProps<typeof buttonVariants> & {
  readonly children: React.ReactNode;
  readonly className?: string;
};

/**
 * Solo el chrome del modal: disparador, portal, overlay, header y las
 * trampas de foco/scroll. El pedido en sí vive en `components/quote-flow`,
 * que es el mismo que renderiza `/pedido`. Como `QuoteFlow` se monta y
 * desmonta con `open`, cerrar el modal resetea el flujo y corta cualquier
 * polling en curso sin que este componente tenga que saber nada de eso.
 */
export function QuoteRequestModal({
  children,
  className,
  variant,
  size,
}: QuoteRequestModalProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // `overflow: hidden` solo frena el scroll con scrollbar: en iOS Safari el
  // arrastre tactil sigue moviendo (y "rebotando") el body por debajo, en
  // vertical Y horizontal, aunque el modal este encima. Fijar el body con
  // `position: fixed` le saca al dedo algo para arrastrar. `top` negativo
  // compensa el scroll ya hecho para que no salte al abrir, y se restaura al
  // cerrar.
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      // rAF y no sincronico: el body recien salio de `position: fixed` (que
      // lo achicaba al alto del viewport) y el navegador todavia no
      // recalculo cuanto mide el documento. Un `scrollTo` inmediato corre
      // contra ese layout viejo y el salto de vuelta queda clampeado a 0.
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <div
                className="absolute inset-0 bg-ink/50"
                onClick={close}
                aria-hidden="true"
              />

              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={copy.title}
                tabIndex={-1}
                className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[480px] flex-col overflow-hidden rounded-panel bg-surface shadow-[0_20px_50px_rgba(28,43,28,0.25)] outline-none"
              >
                <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
                  <p className="font-display text-base font-bold text-ink">
                    {copy.title}
                  </p>
                  <button
                    type="button"
                    aria-label="Cerrar"
                    onClick={close}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-surface-muted hover:text-ink"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <line x1="4" y1="4" x2="20" y2="20" />
                      <line x1="20" y1="4" x2="4" y2="20" />
                    </svg>
                  </button>
                </div>

                <div className="overflow-y-auto px-6 py-6">
                  <QuoteFlow layout="modal" onClose={close} />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
