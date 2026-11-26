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
 * Densidad (2026-11-25): controles de 48px (`h-12`), texto de botón 15px
 * (`text-control`), inputs a 16px y labels de 13px; menos aire entre filas.
 * Los tres botones sociales van en una fila; en celular, con 14px, poco
 * padding y 6px entre ícono y texto (`*:gap-1.5`: el span interno de Clerk
 * trae 12px) para que "Facebook" entre entero a 360px. El input trae
 * `max-height: 2.25rem` de Clerk: `max-h-none` deja que tome los 48px. `unsafe_disableDevelopmentModeWarnings`
 * saca la franja "Development mode" (solo existe en desarrollo): así el
 * widget mide en dev lo mismo que en producción y la reserva de alto de
 * `ClerkSlot` (`private-flow.tsx`) vale para los dos.
 *
 * API verificada en los tipos de `@clerk/react` (`Variables`, `Elements`,
 * `Options`, `GlobalAppearanceOptions.cssLayerName`) de la versión instalada.
 */
export const clerkAppearance = {
  cssLayerName: "clerk",
  options: {
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "blockButton",
    unsafe_disableDevelopmentModeWarnings: true,
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
    card: "m-0 w-full gap-4 overflow-visible rounded-none border-0 bg-transparent p-0 shadow-none",
    header: "hidden",
    logoBox: "hidden",
    main: "gap-4",
    form: "gap-4",
    socialButtons: "gap-2",
    socialButtonsBlockButton:
      "h-12 min-w-0 rounded-full border border-action bg-card px-1.5 text-sm text-fg shadow-none transition-colors *:gap-1.5 hover:bg-brand-50 sm:px-3 sm:text-control",
    socialButtonsBlockButtonText: "font-display text-sm font-semibold text-fg sm:text-control",
    socialButtonsProviderIcon: "size-4 shrink-0",
    dividerRow: "my-0",
    dividerLine: "bg-card-line",
    dividerText: "text-label text-fg-muted",
    formFieldLabel: "text-label font-semibold text-fg",
    formFieldInput:
      "h-12 max-h-none rounded-full border border-control-line-strong bg-card px-5 text-base text-fg shadow-none hover:border-fg-muted focus:border-action",
    formButtonPrimary:
      "h-12 rounded-full bg-action font-display text-control font-semibold text-white normal-case shadow-none transition-colors hover:bg-action-hover",
    footer: "bg-none bg-transparent px-0 pt-0 pb-0",
    footerAction: "justify-center",
    footerActionText: "text-sm text-fg-muted",
    footerActionLink: "text-sm font-semibold text-fg underline underline-offset-4 hover:text-brand-hover",
    formFieldAction: "font-semibold text-fg underline underline-offset-4",
    identityPreviewEditButton: "text-fg underline",
  },
} as const;
