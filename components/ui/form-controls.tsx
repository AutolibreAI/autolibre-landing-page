import { cn } from "@/lib/utils";

/** Estilo compartido por input, select y textarea. */
const controlBase =
  "w-full rounded-field border border-line bg-surface-subtle px-3.5 py-3 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-ink/40 focus-visible:border-brand disabled:opacity-60";

type FieldProps = {
  readonly label: React.ReactNode;
  readonly htmlFor?: string;
  readonly required?: boolean;
  readonly hint?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly className?: string;
};

/** Label + control + ayuda opcional, con el asterisco de requerido unificado. */
export function Field({
  label,
  htmlFor,
  required = false,
  hint,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[0.8125rem] font-semibold text-ink/70"
      >
        {label}
        {required ? (
          <span className="text-brand" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink/55">{hint}</p> : null}
    </div>
  );
}

/** Bloque de campos agrupados bajo un subtítulo, separado por una línea. */
export function FieldGroup({
  title,
  children,
  className,
}: {
  readonly title: React.ReactNode;
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={cn("border-t border-line pt-5", className)}>
      <p className="mb-3 font-display text-[0.9375rem] font-bold text-ink">
        {title}
      </p>
      {children}
    </div>
  );
}

export function Input({
  className,
  ...rest
}: React.ComponentProps<"input">) {
  return <input className={cn(controlBase, className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: React.ComponentProps<"textarea">) {
  return (
    <textarea className={cn(controlBase, "resize-y", className)} {...rest} />
  );
}

export function Select({
  className,
  children,
  ...rest
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        controlBase,
        // Flecha propia para que se vea igual en todos los navegadores
        "cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[position:right_0.75rem_center] bg-no-repeat pr-9",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

/**
 * Campo trampa para bots: invisible y fuera del orden de tabulación.
 * Si viene relleno, el submit se descarta silenciosamente.
 *
 * Es una defensa de cliente únicamente — un bot que postee directo a la
 * API la saltea. Suficiente para el volumen actual, no para spam dirigido.
 */
export function Honeypot({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <input
      type="text"
      name="_hp_email"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="absolute -left-[9999px] size-px opacity-0"
    />
  );
}
