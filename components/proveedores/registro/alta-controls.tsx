import { cn } from "@/lib/utils";

/**
 * Controles del alta en pasos (lienzo `Alta`, sistema AutoLibre AI). Todos
 * envuelven el input nativo: teclado, foco y lectores de pantalla gratis.
 * Sin estado: los usa la isla del formulario.
 */

/**
 * Clases de los campos de texto en píldora para pasarle a `Input`/`Select`
 * de `form-controls` (con `cn`/tailwind-merge pisan las del sistema viejo).
 * 16px: menos dispara el zoom de iOS. Borde `control-line-strong` (4.79:1).
 */
export const altaInput =
  "h-13 rounded-full border-control-line-strong bg-card px-5 py-0 text-base text-fg placeholder:text-fg-subtle hover:border-fg-muted focus-visible:border-action aria-invalid:border-status-alert";

/** Igual que `altaInput`, para el `<select>` (deja lugar a la flecha). */
export const altaSelect = cn(altaInput, "pr-10");

/** Igual que `altaInput`, para el `<textarea>`. */
export const altaTextarea =
  "rounded-3xl border-control-line-strong bg-card px-5 py-3.5 text-base text-fg placeholder:text-fg-subtle hover:border-fg-muted focus-visible:border-action";

/** `h2` de cada bloque de un paso ("¿Cómo se llama tu negocio?"). */
export const altaSectionTitle = "font-display text-2xl font-semibold tracking-tight text-fg";

type FieldProps = {
  readonly label: React.ReactNode;
  readonly htmlFor: string;
  /** "(opcional)" al lado del label. */
  readonly optional?: string;
  readonly hint?: React.ReactNode;
  readonly hintId?: string;
  readonly error?: React.ReactNode;
  readonly errorId?: string;
  readonly children: React.ReactNode;
  readonly className?: string;
};

/** Label + campo + ayuda + error, con los ids que pide `aria-describedby`. */
export function AltaField({ label, htmlFor, optional, hint, hintId, error, errorId, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-control font-semibold text-fg">
        {label}
        {optional ? <span className="font-normal text-fg-muted"> {optional}</span> : null}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="text-label text-fg-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-label font-medium text-status-alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type ChoiceProps = {
  readonly type: "checkbox" | "radio";
  readonly name?: string;
  readonly label: string;
  /** Segunda línea (solo en la tarjeta). */
  readonly description?: string;
  readonly checked: boolean;
  readonly onChange: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
};

const focusRing =
  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand";

/** Chip de 44px (vehículos, motorizaciones): `brand-50` + borde `action` si está marcado. */
export function AltaChip({ type, name, label, checked, onChange, disabled, className }: ChoiceProps) {
  return (
    <label
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-control font-medium text-fg transition-colors motion-reduce:transition-none",
        checked ? "border-action bg-brand-50" : "border-control-line bg-card hover:border-fg-muted",
        focusRing,
        className,
      )}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="size-4 shrink-0 accent-action"
      />
      <span>{label}</span>
    </label>
  );
}

/** Tarjeta de opción de 56px (marcas, modalidad): radio o check a la izquierda. */
export function AltaOption({ type, name, label, description, checked, onChange, disabled, className }: ChoiceProps) {
  return (
    <label
      className={cn(
        "flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4.5 py-2.5 text-base text-fg transition-colors motion-reduce:transition-none",
        checked ? "border-action bg-brand-50" : "border-control-line bg-card hover:border-fg-muted",
        focusRing,
        className,
      )}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="size-5 shrink-0 accent-action"
      />
      <span className="flex flex-col">
        <span>{label}</span>
        {description ? <span className="text-sm text-fg-muted">{description}</span> : null}
      </span>
    </label>
  );
}
