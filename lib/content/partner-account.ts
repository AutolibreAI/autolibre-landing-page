/**
 * Copy compartida por las pantallas privadas de talleres que piden la cuenta
 * de AutoLibre: reclamo (`/proveedores/reclamar`), alta
 * (`/proveedores/registro`), contratación
 * (`/proveedores/contratar` y su `/resultado`) y `/cuenta`.
 *
 * El login es UNO solo en todas: mismo encabezado corto en la tarjeta (el de
 * Clerk va oculto) y el contexto de cada flujo en la columna de al lado.
 */
export const partnerAccountContent = {
  signIn: {
    title: "Entrá o creá tu cuenta",
    body: "Es la misma cuenta de la app de AutoLibre.",
    loading: "Cargando el inicio de sesión…",
  },

  /** Volver a entrar después de un 401. */
  reauth: "Iniciar sesión de nuevo",

  /**
   * Lo que lee un lector de pantalla junto a cada paso de un indicador de
   * progreso (`FlowSteps`): el estado no puede depender solo del color.
   */
  stepStatus: {
    done: "completado",
    current: "paso actual",
    upcoming: "pendiente",
  },
} as const;
