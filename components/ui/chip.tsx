import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Chip del sistema AutoLibre AI: píldora de 44px (o 48) con borde
 * `control-line` sobre `card`; seleccionado, `brand-50` con borde `action`
 * (el estado no depende solo del color: cambia también el borde, y el
 * interactivo lo expone con `aria-pressed`).
 *
 * Sin `"use client"`: si se le pasa `onClick` desde una isla de cliente,
 * corre ahí; en el server se usa como chip estático.
 */
const chipVariants = cva(
  "inline-flex shrink-0 items-center gap-2 rounded-full border font-medium whitespace-nowrap text-fg transition-colors motion-reduce:transition-none",
  {
    variants: {
      selected: {
        true: "border-action bg-brand-50",
        false: "border-control-line bg-card",
      },
      interactive: {
        true: "disabled:cursor-not-allowed disabled:opacity-50",
        false: "",
      },
      size: {
        "44": "h-11 text-sm",
        "48": "h-12 text-control",
      },
      withIcon: {
        true: "pr-4 pl-2",
        false: "px-4",
      },
    },
    compoundVariants: [
      {
        interactive: true,
        selected: false,
        className: "hover:border-fg-subtle",
      },
    ],
    defaultVariants: { selected: false, interactive: false, size: "44", withIcon: false },
  },
);

type ChipCommonProps = {
  readonly children: React.ReactNode;
  /** Ícono o imagen decorativa a la izquierda (va con `aria-hidden`/`alt=""`). */
  readonly icon?: React.ReactNode;
  readonly size?: "44" | "48";
  readonly className?: string;
};

/** Chip estático (`<span>`): una etiqueta, un filtro aplicado. */
type StaticChipProps = ChipCommonProps & {
  readonly pressed?: undefined;
  readonly selected?: boolean;
};

/** Chip interactivo (`<button aria-pressed>`): un toggle. */
type ToggleChipProps = ChipCommonProps & {
  readonly pressed: boolean;
} & Omit<
    React.ComponentProps<"button">,
    "children" | "className" | "type" | "aria-pressed"
  >;

export type ChipProps = StaticChipProps | ToggleChipProps;

export function Chip(props: ChipProps) {
  if (props.pressed === undefined) {
    const { children, icon, size, className, selected = false } = props;
    return (
      <span
        className={cn(
          chipVariants({ selected, size, withIcon: Boolean(icon) }),
          className,
        )}
      >
        {icon}
        {children}
      </span>
    );
  }

  const { children, icon, size, className, pressed, ...rest } = props;
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        chipVariants({
          selected: pressed,
          interactive: true,
          size,
          withIcon: Boolean(icon),
        }),
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export { chipVariants };
