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
 * Rediseño 2026-11 (lienzo `Ingresar`, sistema AutoLibre AI): inputs y
 * botones en píldora, el principal en `action` (blanco encima, 14.88:1), los
 * de Google/Apple/Facebook en contorno, y los botones sociales DEBAJO del
 * email (`options.socialButtonsPlacement: "bottom"`), como el lienzo. Borde
 * de los inputs `control-line-strong` (4.79:1, WCAG 1.4.11).
 *
 * API verificada en los tipos de `@clerk/react` (`Variables`, `Elements`,
 * `Options`, `GlobalAppearanceOptions.cssLayerName`) de la versión instalada.
 */
export const clerkAppearance = {
  cssLayerName: "clerk",
  options: {
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "blockButton",
  },
  variables: {
    colorPrimary: "var(--color-action)",
    colorPrimaryForeground: "var(--color-card)",
    colorForeground: "var(--color-fg)",
    colorMutedForeground: "var(--color-fg-muted)",
    colorBackground: "var(--color-card)",
    colorInput: "var(--color-card)",
    colorInputForeground: "var(--color-fg)",
    colorRing: "var(--color-brand)",
    colorDanger: "var(--color-status-alert)",
    fontFamily: "inherit",
    fontFamilyButtons: "var(--font-display)",
    // 16px: menos dispara el zoom de iOS en los inputs.
    fontSize: "1rem",
    borderRadius: "1.75rem",
  },
  elements: {
    rootBox: "w-full",
    // `overflow-visible` + `m-0`: Clerk le pone `overflow: hidden` al cardBox
    // y márgenes negativos a la card (para tapar su propio borde). Con
    // `p-0` eso recortaba el borde derecho de los botones y el badge
    // "Último usado", que sobresale de la esquina del botón de Google.
    cardBox: "w-full max-w-none overflow-visible rounded-none border-0 bg-transparent shadow-none",
    card: "m-0 w-full gap-5 overflow-visible rounded-none border-0 bg-transparent p-0 shadow-none",
    header: "hidden",
    logoBox: "hidden",
    socialButtons: "gap-2.5",
    socialButtonsBlockButton:
      "h-13 rounded-full border border-action bg-card text-base text-fg shadow-none transition-colors hover:bg-brand-50",
    socialButtonsBlockButtonText: "font-display font-semibold text-fg",
    dividerLine: "bg-card-line",
    dividerText: "text-sm text-fg-muted",
    formFieldLabel: "text-label font-semibold text-fg",
    formFieldInput:
      "h-13 rounded-full border border-control-line-strong bg-card px-5 text-base text-fg shadow-none hover:border-fg-muted focus:border-action",
    formButtonPrimary:
      "h-13 rounded-full bg-action font-display text-base font-semibold text-white normal-case shadow-none transition-colors hover:bg-action-hover",
    footer: "bg-none bg-transparent px-0 pt-2 pb-0",
    footerAction: "justify-center",
    footerActionText: "text-sm text-fg-muted",
    footerActionLink: "text-sm font-semibold text-fg underline underline-offset-4 hover:text-brand-hover",
    formFieldAction: "font-semibold text-fg underline underline-offset-4",
    identityPreviewEditButton: "text-fg underline",
  },
} as const;
