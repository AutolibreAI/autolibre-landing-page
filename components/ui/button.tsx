import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Botón compartido. Conviven DOS sistemas mientras dura el rediseño
 * (2026-11, ver DESIGN.md):
 *
 * - **AutoLibre AI (vigente)**: variantes `primary`, `outline`, `light` y `outlineDark`, en
 *   píldora, con Outfit semibold y alto fijo de 44 a 56px (tamaños `"44"`,
 *   `"48"`, `"52"`, `"56"`). Es lo que se usa en código nuevo.
 * - **Anterior (deprecado)**: `brand`, `brandOutline`, `outlineInverse` e
 *   `inverse`, con radio `field` y tamaños `sm`/`md`/`lg`. Quedan para que
 *   las páginas que todavía no se migraron se vean igual; se borran al
 *   terminar la migración.
 *
 * El default sigue siendo el del sistema anterior (`brand` + `md`) para no
 * cambiar los call sites que no pasan `variant`: en código nuevo pasá
 * SIEMPRE `variant` y `size`.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        // ── AutoLibre AI ──
        /**
         * Acción principal: `action` con texto blanco (14.88:1; en hover,
         * 12.09:1). El verde de marca NO va de fondo de botón.
         */
        primary:
          "rounded-full bg-action font-display text-white hover:bg-action-hover",
        /** Secundaria sobre fondos claros: borde `action` sobre `card`. */
        outline:
          "rounded-full border border-action bg-card font-display text-fg hover:bg-brand-50",
        /** Sobre fondos oscuros (`action`/`ink`): `card` con texto `fg` (17.58:1). */
        light:
          "rounded-full bg-card font-display text-fg hover:bg-brand-50",
        /**
         * Secundaria sobre fondos oscuros (`action`): borde `on-dark-subtle`
         * (4.86:1, WCAG 1.4.11) y texto blanco (14.88:1).
         */
        outlineDark:
          "rounded-full border border-on-dark-subtle font-display text-white hover:bg-action-hover",
        /**
         * Principal sobre fondos oscuros (`action`): `brand-200` con texto `fg`
         * (11.70:1). Bandas "¿No sabés a quién elegir?" y "Sumate a AutoLibre".
         */
        accent: "rounded-full bg-brand-200 font-display text-fg hover:bg-brand-50",

        // ── Sistema anterior (deprecado) ──
        /**
         * CTA verde del sistema anterior. En reposo va el verde oscuro y en
         * hover se aclara: blanco sobre `brand-hover` mide 5.74:1; sobre
         * `brand` serían 4.28:1 y no llegaría.
         */
        brand: "rounded-field bg-brand-hover text-white hover:bg-brand",
        /** Secundario sobre fondos claros: contorno. */
        brandOutline:
          "rounded-field border border-ink/30 text-ink hover:border-brand hover:text-brand",
        /** Secundario sobre fondos oscuros (ink): contorno blanco. */
        outlineInverse:
          "rounded-field border border-white/40 text-white hover:border-white hover:bg-white/10",
        /** CTA sobre la sección verde de cierre. */
        inverse: "rounded-field bg-white text-ink hover:bg-white/90",
      },
      size: {
        // ── AutoLibre AI: alto fijo, objetivo táctil de 44px como mínimo ──
        "44": "h-11 px-5 text-control",
        "48": "h-12 px-5 text-control",
        "52": "h-13 px-6 text-base",
        "56": "h-14 px-7 text-base",

        // ── Sistema anterior (deprecado) ──
        sm: "px-4 py-2 text-sm",
        md: "px-5 py-2.5 text-[0.9375rem]",
        lg: "px-6 py-3.5 text-base",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "brand", size: "md" },
  },
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  readonly className?: string;
  readonly children: React.ReactNode;
};

type ButtonProps = ButtonBaseProps &
  Omit<React.ComponentProps<"button">, "className" | "children">;

/**
 * `<button>` nativo. Pasá `type` siempre: sin él, adentro de un `<form>` el
 * browser lo trata como submit (no se fuerza un default para no cambiar el
 * comportamiento de los call sites existentes).
 */
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
 * Misma apariencia que `Button` pero navega dentro del sitio. Se usa un
 * `Link` real (no un `button` con onClick) para que el enlace sea rastreable
 * e indexable.
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

type ButtonAnchorProps = ButtonBaseProps &
  Omit<React.ComponentProps<"a">, "className" | "children">;

/**
 * Misma apariencia que `Button` para links que salen del sitio (WhatsApp,
 * tiendas, aliados): `<a>` nativo, el router de `next/link` no aporta nada.
 * `target`/`rel` los decide el consumidor.
 */
export function ButtonAnchor({
  variant,
  size,
  block,
  className,
  children,
  ...rest
}: ButtonAnchorProps) {
  return (
    <a
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...rest}
    >
      {children}
    </a>
  );
}

export { buttonVariants };
