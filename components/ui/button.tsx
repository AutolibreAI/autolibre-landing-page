import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-field font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        /** CTA principal sobre fondos claros. */
        primary: "bg-brand text-white hover:bg-brand-hover",
        /** Secundario sobre fondos claros: contorno. */
        outline:
          "border border-ink/30 text-ink hover:border-brand hover:text-brand",
        /** CTA sobre la banda oscura de proveedores. */
        soft: "bg-brand-soft text-ink hover:bg-brand-soft/85",
        /** CTA sobre la sección verde de cierre. */
        inverse: "bg-white text-ink hover:bg-white/90",
      },
      size: {
        sm: "px-4 py-2 text-sm",
        md: "px-5 py-2.5 text-[0.9375rem]",
        lg: "px-6 py-3.5 text-base",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  readonly className?: string;
  readonly children: React.ReactNode;
};

type ButtonProps = ButtonBaseProps &
  Omit<React.ComponentProps<"button">, "className" | "children">;

export function Button({
  variant,
  size,
  block,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...rest}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = ButtonBaseProps &
  Omit<React.ComponentProps<typeof Link>, "className" | "children">;

/**
 * Misma apariencia que `Button` pero navega. Se usa un `Link` real (no un
 * `button` con onClick) para que el enlace sea rastreable e indexable.
 */
export function ButtonLink({
  variant,
  size,
  block,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

export { buttonVariants };
