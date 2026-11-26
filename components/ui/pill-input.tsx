import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Input en píldora del sistema AutoLibre AI. Server Component: no tiene
 * estado propio, así que sirve igual dentro de una isla de cliente (form
 * controlado) que en un form server.
 *
 * - `label` es OBLIGATORIO y queda asociado por `htmlFor`/`id`. Si el diseño
 *   no lo muestra, `hideLabel` lo deja solo para lectores de pantalla (nunca
 *   se reemplaza por el placeholder).
 * - Fuente de 16px en todos los anchos: menos que eso hace que iOS haga zoom
 *   al enfocar.
 * - Foco: el anillo global (`:focus-visible` de `globals.css`) más el borde
 *   en `action`. No se suprime el outline.
 */
const pillInputVariants = cva(
  "w-full rounded-full border border-control-line-strong bg-card px-5 text-base text-fg transition-colors motion-reduce:transition-none placeholder:text-fg-subtle hover:border-fg-muted focus-visible:border-action disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-status-alert",
  {
    variants: {
      size: {
        "52": "h-13",
        "56": "h-14",
      },
    },
    defaultVariants: { size: "56" },
  },
);

type PillInputProps = Omit<
  React.ComponentProps<"input">,
  "id" | "size" | "className"
> & {
  /** Obligatorio: lo usa el `<label htmlFor>` y los ids de ayuda y error. */
  readonly id: string;
  readonly label: React.ReactNode;
  /** Oculta el label a la vista (sigue en el árbol de accesibilidad). */
  readonly hideLabel?: boolean;
  /** Ayuda debajo del campo (`{id}-hint`, enlazada por `aria-describedby`). */
  readonly hint?: React.ReactNode;
  /** Error del campo (`{id}-error`): marca `aria-invalid`. */
  readonly error?: React.ReactNode;
  /** Alto en px: 52 o 56 (default). */
  readonly size?: "52" | "56";
  /** Clases del wrapper (label + input + textos). */
  readonly className?: string;
  /** Clases extra del `<input>`. */
  readonly inputClassName?: string;
};

export function PillInput({
  id,
  label,
  hideLabel = false,
  hint,
  error,
  size,
  required,
  className,
  inputClassName,
  "aria-describedby": describedBy,
  ...rest
}: PillInputProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedByIds =
    [describedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          "text-label font-semibold text-fg",
          hideLabel && "sr-only",
        )}
      >
        {label}
        {required ? (
          <span className="text-brand-hover" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByIds}
        className={cn(pillInputVariants({ size }), inputClassName)}
        {...rest}
      />
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

export { pillInputVariants };
