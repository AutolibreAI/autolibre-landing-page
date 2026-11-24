import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Pill de estado del sistema AutoLibre AI (13px semibold, píldora). El texto
 * dice el estado: el color acompaña, nunca es la única señal.
 *
 * Contrastes del texto: ok 4.70:1, pendiente 8.15:1, alerta 5.26:1, neutro
 * 9.18:1. El neutro usa `canvas` de fondo, así que sobre una página `canvas`
 * no se distingue el contorno: ahí va dentro de una tarjeta (`card`).
 *
 * No es una región viva: si el estado cambia en vivo, el consumidor le pone
 * `role="status"` (ver `OpenStatusBadge`).
 */
const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        ok: "bg-status-ok-bg text-status-ok",
        pending: "bg-status-pending-bg text-status-pending",
        alert: "bg-alert-bg text-status-alert",
        neutral: "bg-canvas text-fg-muted",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

const dotTone = {
  ok: "bg-status-ok",
  pending: "bg-status-pending",
  alert: "bg-status-alert",
  neutral: "bg-fg-subtle",
} as const;

type StatusPillProps = {
  readonly tone?: keyof typeof dotTone;
  /** Punto de color a la izquierda (decorativo). */
  readonly dot?: boolean;
  readonly children: React.ReactNode;
  readonly className?: string;
} & Omit<React.ComponentProps<"span">, "children" | "className">;

export function StatusPill({
  tone = "neutral",
  dot = false,
  children,
  className,
  ...rest
}: StatusPillProps) {
  return (
    <span className={cn(statusPillVariants({ tone }), className)} {...rest}>
      {dot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", dotTone[tone])}
        />
      ) : null}
      {children}
    </span>
  );
}

export { statusPillVariants };
