import type { ArWhatsappError } from "@/lib/phone";

/**
 * Errores del WhatsApp (ver `parseArWhatsapp` en `lib/phone.ts`). Los usan el
 * form de `/pedido`, el módulo de pedido, el modal de la home y el alta de
 * proveedores (form y `/api/provider`). `{n}` = cantidad de dígitos.
 *
 * Archivo propio (y re-exportado desde `presupuesto.ts`) para que una isla
 * de cliente que solo necesita estos mensajes no arrastre todo el copy de
 * `/pedido` a su bundle.
 */
const WHATSAPP_ERRORS = {
  empty: "Ingresá tu WhatsApp con código de área. Ej: 11 2345-6789",
  missing_area_code: "Falta el código de área. Ej: 11 2345-6789",
  too_short_one: "Al número le falta 1 dígito.",
  too_short: "Al número le faltan {n} dígitos.",
  too_long_one: "El número tiene 1 dígito de más.",
  too_long: "El número tiene {n} dígitos de más.",
  invalid_area_code: "Revisá el código de área. Ej: 11, 221 o 351.",
  fake: "Revisá el número: parece incompleto.",
} as const;

/** Mensaje para un WhatsApp inválido, con la cantidad de dígitos si aplica. */
export function whatsappErrorMessage(error: ArWhatsappError, diff = 0): string {
  if (error === "too_short" || error === "too_long") {
    return diff === 1
      ? WHATSAPP_ERRORS[`${error}_one`]
      : WHATSAPP_ERRORS[error].replace("{n}", String(diff));
  }
  return WHATSAPP_ERRORS[error];
}
