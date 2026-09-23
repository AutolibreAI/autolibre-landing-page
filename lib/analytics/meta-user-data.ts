import "server-only";
import { createHash } from "node:crypto";

/**
 * `user_data.ph` de la Conversions API: el WhatsApp del pedido, normalizado
 * como pide Meta (sólo dígitos, con código de país, sin `+` ni ceros
 * adelante) y hasheado con SHA-256. El número crudo nunca sale del server ni
 * se loguea: a Meta sólo le llega el hash.
 *
 * Todo el tráfico es de Argentina y los WhatsApp son celulares, así que se
 * arma el formato internacional de móvil AR: `549` + número nacional de 10
 * dígitos (característica + abonado, sin `0` ni `15`). El form sugiere
 * "11 2345 6789" (ver `lib/content/presupuesto.ts`), pero la gente escribe
 * de todo; lo que se contempla:
 *
 * - `+54 9 11 2345-6789`, `0054 9 11…`, `54 11 2345 6789` → `5491123456789`
 * - `011 2345 6789`, `11 2345 6789` → `5491123456789`
 * - `011 15 2345 6789`, `11 15 2345 6789` → `5491123456789`
 *
 * Limitaciones (documentadas a propósito):
 * - El `15` local sólo se saca con característica `11`: es la única de 2
 *   dígitos y ninguna otra empieza con `1`, así que ahí la posición del `15`
 *   es inequívoca. En el resto (3 o 4 dígitos) sacarlo exige la tabla de
 *   características; esos números quedan con 12 dígitos y se omiten.
 * - Sin característica ("15 2345 6789", "2345 6789") no hay forma de saber
 *   el área: también se omite.
 * Omitir `ph` es mejor que mandar un hash de un número mal armado: el `Lead`
 * sale igual, sólo sin ese dato de match.
 */

/** Número nacional argentino: característica + abonado, siempre 10 dígitos. */
const AR_NATIONAL_LENGTH = 10;

/** Las características argentinas son `11` o arrancan con 2 o 3. */
const AR_AREA_CODE_START = /^(?:11|[23])/;

/**
 * Devuelve el número en formato E.164 sin `+` (`549XXXXXXXXXX`) o `null` si
 * no se puede armar uno confiable. Pura: sin hash, para poder probarla.
 */
export function normalizeArWhatsapp(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);

  let national: string;
  // Con código de país sólo si el largo da para uno (54 + 10 como mínimo):
  // ninguna característica AR empieza con 5, así que un "54" adelante de un
  // número completo no puede ser otra cosa.
  if (digits.startsWith("54") && digits.length >= 2 + AR_NATIONAL_LENGTH) {
    national = digits.slice(2);
    // El 9 de móvil: se saca para validar el nacional y se vuelve a poner.
    if (national.startsWith("9") && national.length > AR_NATIONAL_LENGTH) {
      national = national.slice(1);
    }
  } else {
    national = digits;
    // "9 11 2345 6789": el 9 de móvil sin el 54.
    if (national.startsWith("9") && national.length === AR_NATIONAL_LENGTH + 1) {
      national = national.slice(1);
    }
  }

  // Prefijo de discado nacional (`0` adelante de la característica).
  if (national.startsWith("0")) national = national.slice(1);

  // `11 15 XXXX XXXX` → `11 XXXX XXXX` (ver limitaciones arriba).
  if (national.length === AR_NATIONAL_LENGTH + 2 && national.startsWith("1115")) {
    national = `11${national.slice(4)}`;
  }

  // Toda característica AR es `11` o empieza con 2 o 3: cualquier otra cosa
  // ("15 2345 6789" sin área, por ejemplo) no es un número nacional.
  if (national.length !== AR_NATIONAL_LENGTH || !AR_AREA_CODE_START.test(national)) {
    return null;
  }
  return `549${national}`;
}

/** `ph` listo para `user_data`: SHA-256 en hex del número normalizado. */
export function hashedWhatsappForMeta(raw: unknown): string[] | undefined {
  if (typeof raw !== "string") return undefined;
  const normalized = normalizeArWhatsapp(raw);
  if (!normalized) return undefined;
  return [createHash("sha256").update(normalized).digest("hex")];
}
