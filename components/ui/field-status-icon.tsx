import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Estado de un campo, dibujado ADENTRO del control, a la derecha.
 *
 * - `validating`: se está verificando (spinner; quieto con movimiento reducido).
 * - `valid`: verificado.
 * - `notice`: no se pudo verificar, pero no es un error (no bloquea nada).
 * - `invalid`: error del campo (el texto del error va aparte, debajo).
 */
export type FieldStatus = "idle" | "validating" | "valid" | "notice" | "invalid";

/** Padding derecho que tiene que llevar el control para que el texto no pase por debajo del ícono. */
export const FIELD_STATUS_PADDING = "pr-11";

const tones: Record<Exclude<FieldStatus, "idle">, string> = {
  validating: "text-ink/65",
  valid: "text-brand",
  notice: "text-ink/65",
  invalid: "text-danger",
};

/**
 * Decorativo (`aria-hidden`): el estado lo tiene que decir también el campo
 * (`aria-invalid`, el texto de error, o una región `aria-live`). Va dentro de
 * un contenedor `relative` que envuelve al control.
 */
export function FieldStatusIcon({
  status,
  className,
}: {
  readonly status: FieldStatus;
  readonly className?: string;
}) {
  if (status === "idle") return null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-1/2 right-3.5 flex size-5 -translate-y-1/2 items-center justify-center",
        tones[status],
        className,
      )}
    >
      {status === "validating" ? (
        <>
          <Icon name="spinner" size={20} strokeWidth={2.4} className="animate-spin motion-reduce:hidden" />
          <Icon name="ellipsis" size={20} strokeWidth={2.4} className="hidden motion-reduce:block" />
        </>
      ) : null}
      {status === "valid" ? <Icon name="check" size={20} strokeWidth={2.4} /> : null}
      {status === "notice" ? <Icon name="info" size={20} strokeWidth={2} /> : null}
      {status === "invalid" ? <Icon name="alert" size={20} strokeWidth={2} /> : null}
    </span>
  );
}
