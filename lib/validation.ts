export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Cuenta dígitos. Ya no valida nada: la regla del WhatsApp es
 * `parseArWhatsapp` (`lib/phone.ts`). Queda por compatibilidad con quien la
 * importa desde `components/quote-flow`.
 */
export function whatsappDigitCount(raw: string): number {
  return raw.replace(/\D/g, "").length;
}
