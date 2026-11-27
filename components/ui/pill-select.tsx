import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { pillInputVariants } from "./pill-input";

type PillSelectProps = Omit<React.ComponentProps<"select">, "id" | "size" | "className"> & {
  /** Obligatorio: lo usa el `<label htmlFor>` y los ids de ayuda y error. */
  readonly id: string;
  readonly label: React.ReactNode;
  /** Ayuda debajo del campo (`{id}-hint`, enlazada por `aria-describedby`). */
  readonly hint?: React.ReactNode;
  /** Error del campo (`{id}-error`): marca `aria-invalid`. */
  readonly error?: React.ReactNode;
  /** Alto en px: 52 o 56 (default). */
  readonly size?: "52" | "56";
  /** Clases del wrapper (label + select + textos). */
  readonly className?: string;
};

/**
 * Desplegable en píldora: el par de `PillInput` (mismo label, alto, borde,
 * foco, ayuda y error) con un `<select>` nativo, que en celular abre el
 * selector del sistema. Fuente de 16px: menos hace que iOS haga zoom. Sin
 * estado propio: sirve en un form server o adentro de una isla.
 */
export function PillSelect({
  id,
  label,
  hint,
  error,
  size,
  required,
  className,
  children,
  "aria-describedby": describedBy,
  ...rest
}: PillSelectProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedByIds = [describedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-label font-semibold text-fg">
        {label}
        {required ? (
          <span className="text-brand-hover" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <div className="relative">
        <select
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByIds}
          // Flecha propia (el ícono de abajo): igual en todos los navegadores.
          className={cn(pillInputVariants({ size }), "cursor-pointer appearance-none truncate pr-12")}
          {...rest}
        >
          {children}
        </select>
        <Icon
          name="chevron-down"
          size={20}
          strokeWidth={1.8}
          className="pointer-events-none absolute top-1/2 right-4.5 -translate-y-1/2 text-fg-muted"
        />
      </div>
      {hint ? (
        <p id={hintId} className="px-5 text-label text-fg-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="px-5 text-label font-medium text-status-alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
