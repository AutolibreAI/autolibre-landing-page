/**
 * Apariencia ÚNICA del `<SignIn>` de Clerk en las pantallas privadas de
 * talleres (la usa `ScopedClerkProvider`). Objetivo: que el login se vea
 * como el resto del sitio y no como un widget pegado.
 *
 * - `cssLayerName: "clerk"`: Clerk inyecta sus estilos SIN capa, y en
 *   Tailwind v4 las utilities viven en `@layer utilities`: sin esto, las
 *   clases de `elements` pierden contra el CSS de Clerk (por eso antes el
 *   `header: "hidden"` no ocultaba nada). `app/globals.css` declara el orden
 *   `theme, base, clerk, components, utilities`, así las utilities ganan.
 * - `variables`: los tokens del `@theme` como CSS variables (`var(--…)`),
 *   no hex sueltos. La versión de clerk-js que carga `@clerk/nextjs` 7
 *   resuelve variables CSS (deriva tonos con `color-mix`). Si alguna no
 *   aplicara, las clases de `elements` cubren lo visible (botón primario,
 *   inputs, links), que es lo que importa.
 * - `elements`: la tarjeta de Clerk va transparente y sin borde ni sombra:
 *   la tarjeta es la nuestra (`SignInLayout`). Su encabezado (logo +
 *   "Continuar a …") va oculto: el título es el nuestro, uno solo.
 *
 * API verificada en los tipos de `@clerk/react` (`Variables`, `Elements`,
 * `GlobalAppearanceOptions.cssLayerName`) de la versión instalada.
 */
export const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "var(--color-brand-hover)",
    colorPrimaryForeground: "var(--color-surface)",
    colorForeground: "var(--color-ink)",
    colorBackground: "var(--color-surface)",
    colorInput: "var(--color-surface-subtle)",
    colorInputForeground: "var(--color-ink)",
    colorRing: "var(--color-brand)",
    colorDanger: "var(--color-danger)",
    fontFamily: "inherit",
    fontFamilyButtons: "inherit",
    // 16px: menos dispara el zoom de iOS en los inputs.
    fontSize: "1rem",
    borderRadius: "var(--radius-field)",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full max-w-none rounded-none border-0 bg-transparent shadow-none",
    card: "gap-6 rounded-none border-0 bg-transparent p-0 shadow-none",
    header: "hidden",
    logoBox: "hidden",
    socialButtonsBlockButton:
      "min-h-12 rounded-field border border-ink/20 bg-surface text-base text-ink shadow-none transition-colors hover:border-brand hover:bg-surface",
    socialButtonsBlockButtonText: "font-semibold text-ink",
    dividerLine: "bg-line",
    dividerText: "text-label text-ink/60",
    formFieldLabel: "text-label font-semibold text-ink/70",
    formFieldInput:
      "min-h-12 rounded-field border border-line bg-surface-subtle text-base text-ink shadow-none focus:border-brand",
    formButtonPrimary:
      "min-h-12 rounded-field bg-brand-hover text-base font-semibold text-white normal-case shadow-none transition-colors hover:bg-brand",
    footer: "bg-none bg-transparent px-0 pt-2 pb-0",
    footerAction: "justify-center",
    footerActionText: "text-sm text-ink/70",
    footerActionLink: "text-sm font-semibold text-brand-hover hover:text-brand",
    formFieldAction: "font-semibold text-brand-hover",
    identityPreviewEditButton: "text-brand-hover",
  },
} as const;
