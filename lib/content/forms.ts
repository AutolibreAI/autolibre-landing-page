/**
 * Copy y opciones de los formularios que no son el de proveedores.
 *
 * OJO: `SUPPORT_SUBJECTS` no es sólo texto de UI — viaja como dato al email
 * de soporte. Editarlo cambia lo que llega al equipo.
 */

export const SUPPORT_SUBJECTS = [
  "Problema técnico",
  "Cuenta o acceso",
  "Facturación",
  "Sugerencia",
  "Otro",
] as const;

export const supportCopy = {
  title: "¿Necesitás ayuda?",
  subtitle:
    "Contanos qué te está pasando y te respondemos lo antes posible. Un humano lee cada mensaje.",
  highlights: [
    "Te respondemos en menos de 24hs hábiles.",
    "Un humano lee cada mensaje, no un bot.",
    "Guardá el link de esta página para futuros reclamos.",
  ],
  contactHint:
    "Dejanos al menos un dato de contacto: email o teléfono.",
  contactError: "Dejanos un email o un teléfono para poder contactarte.",
  submitLabel: "Enviar mensaje",
  submitLoadingLabel: "Enviando...",
  success: {
    title: "¡Mensaje enviado!",
    description: "Te vamos a responder a la brevedad.",
  },
  genericError: "Algo salió mal. Por favor intentá de nuevo.",
} as const;

export const accountDeletionCopy = {
  title: "Eliminar tu cuenta de AutoLibre",
  subtitle:
    "Pedí la baja definitiva de tu cuenta y de todos los datos asociados. Un miembro de nuestro equipo se va a comunicar para completarla.",
  highlights: [
    "Un miembro de nuestro equipo revisa cada solicitud manualmente.",
    "Te contactamos al email registrado para confirmar la baja.",
    "La eliminación incluye vehículos, documentos e historial guardado.",
  ],
  submitLabel: "Solicitar eliminación",
  submitLoadingLabel: "Enviando...",
  success: {
    title: "¡Solicitud recibida!",
    description:
      "Recibimos tu solicitud, un miembro de nuestro equipo se va a comunicar para completar la eliminación de tu cuenta.",
  },
  invalidEmail: "Ingresá un email válido.",
  genericError: "Algo salió mal. Por favor intentá de nuevo.",
} as const;
