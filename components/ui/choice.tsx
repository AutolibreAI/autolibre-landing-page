import { cn } from "@/lib/utils";

/**
 * Píldora seleccionable. El input nativo queda visible pero chico
 * (`accent-color` de marca) porque el diseño de proveedores lo muestra así,
 * y mantener el control nativo nos da accesibilidad de teclado gratis.
 */
const pillBase =
  "flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand";

const pillState = {
  on: "border-brand bg-brand/8 text-ink",
  off: "border-line bg-surface-subtle text-ink hover:border-brand/40",
} as const;

type ChoicePillProps = {
  readonly type: "checkbox" | "radio";
  readonly name?: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: () => void;
  readonly className?: string;
};

export function ChoicePill({
  type,
  name,
  label,
  checked,
  onChange,
  className,
}: ChoicePillProps) {
  return (
    <label
      className={cn(pillBase, checked ? pillState.on : pillState.off, className)}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="size-4 shrink-0 accent-brand"
      />
      <span>{label}</span>
    </label>
  );
}

/**
 * Variante en fila (no píldora) para opciones con texto largo, como el
 * "Sí / No" de especialización por marcas.
 */
export function ChoiceRow({
  type,
  name,
  label,
  checked,
  onChange,
}: Omit<ChoicePillProps, "className">) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-field border px-3.5 py-2.5 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
        checked ? pillState.on : pillState.off,
      )}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="size-4 shrink-0 accent-brand"
      />
      <span>{label}</span>
    </label>
  );
}
