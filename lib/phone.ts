/**
 * Celulares argentinos para WhatsApp. Pura e isomórfica: la usan el form de
 * `/pedido`, el modal de la home, `/api/presupuesto` y la Conversions API
 * (`lib/analytics/meta-user-data.ts`). Una sola regla en los cuatro lados.
 *
 * Plan de numeración argentino: el número nacional es SIEMPRE de 10 dígitos,
 * característica (código de área) + abonado:
 *
 * - `11` (AMBA) + 8 dígitos. Es la única característica de 2 dígitos y la
 *   única que empieza con `1`.
 * - 3 dígitos (`221`, `351`… ver `AR_AREA_CODES_3`) + 7.
 * - 4 dígitos (`2966`, `3543`…) + 6. Todo lo demás que empieza con 2 o 3.
 *
 * El plan es "libre de prefijos": ninguna característica de 4 dígitos
 * empieza con una de 3 (no hay `221x`). Por eso alcanza con la lista corta de
 * las de 3 para saber dónde termina CUALQUIER característica.
 *
 * La forma canónica es la internacional de móvil, `549` + nacional
 * (`5491123456789`): la misma que guarda `WhatsappNumber` en
 * autolibre-backend-hex (src/shared/domain/value-objects/whatsapp-number.vo.ts)
 * y la que usa wa.me.
 *
 * Lo que la gente escribe y se acepta:
 *
 * - Prefijo internacional: `+54`, `54`, `0054`, con o sin el `9` de móvil.
 * - El `0` de larga distancia: `011…`, `(0221)…`.
 * - El `15` de la marcación local DESPUÉS de la característica:
 *   `11 15 2345-6789`, `(0221) 15 456-7890`, `2966 15 45-6789`. Solo cuando
 *   sobran dígitos (12 en vez de 10): un abonado que empieza con 15
 *   (`11 1523-4567`) es un número válido y no se toca.
 *
 * Límites (documentados a propósito):
 * - No se verifica que una característica de 4 dígitos EXISTA (serían ~250
 *   para cargar). Un `4…` o un `5…` se rechazan (no hay áreas así), pero un
 *   `2999…` pasa.
 * - Sin característica no hay forma de adivinar el área: `15 2345-6789` o
 *   `2345-6789` se rechazan con un mensaje que pide el código de área.
 * - Es para celulares: un fijo con 10 dígitos pasa (no hay forma de
 *   distinguirlo), pero no tendrá WhatsApp. Lo mismo hace el backend.
 */

/** Número nacional argentino: característica + abonado. */
export const AR_NATIONAL_LENGTH = 10;

/**
 * Características de 3 dígitos (plan de numeración de ENACOM). El resto de
 * las que empiezan con 2 o 3 son de 4 dígitos. Fuente: plan fundamental de
 * numeración / "Números telefónicos en Argentina"; revisar si ENACOM asigna
 * una nueva.
 */
export const AR_AREA_CODES_3: ReadonlySet<string> = new Set([
  "220", "221", "223", "230", "236", "237", "249", "260", "261", "263",
  "264", "266", "280", "291", "294", "297", "298", "299", "336", "341",
  "342", "343", "345", "348", "351", "353", "358", "362", "364", "370",
  "376", "379", "380", "381", "383", "385", "387", "388",
]);

/** El prefijo de la marcación local a un celular. */
const LOCAL_MOBILE_PREFIX = "15";

/**
 * Largo de la característica al principio de `national`, o `null` si todavía
 * no se puede saber (vacío, `2`/`22` a medio escribir) o si no empieza como
 * una característica argentina (`15…`, `4…`).
 */
export function arAreaCodeLength(national: string): 2 | 3 | 4 | null {
  if (national.startsWith("11")) return 2;
  if (!/^[23]/.test(national) || national.length < 3) return null;
  return AR_AREA_CODES_3.has(national.slice(0, 3)) ? 3 : 4;
}

export type ArWhatsappError =
  /** Vacío. */
  | "empty"
  /** Local sin característica: `2345 6789`, `15 2345 6789`. */
  | "missing_area_code"
  /** Le faltan dígitos (`diff` cuántos). */
  | "too_short"
  /** Le sobran dígitos (`diff` cuántos). */
  | "too_long"
  /** Diez dígitos, pero ninguna característica argentina empieza así. */
  | "invalid_area_code"
  /** Todos los dígitos iguales: `11 1111 1111`, `11 0000 0000`. */
  | "fake";

export type ArWhatsappResult =
  | {
      readonly ok: true;
      /** Característica + abonado, 10 dígitos: `1123456789`. */
      readonly national: string;
      /** Forma canónica del backend y de wa.me: `5491123456789`. */
      readonly canonical: string;
      readonly areaCodeLength: 2 | 3 | 4;
    }
  | {
      readonly ok: false;
      readonly error: ArWhatsappError;
      /** Dígitos de más o de menos, para `too_long` / `too_short`. */
      readonly diff?: number;
    };

/**
 * Saca lo que el `+54` hace redundante al principio: `00`, `54`, el `9` de
 * móvil y el `0` de larga distancia. Ningún número nacional empieza con 0, 5
 * ni 9, así que nada de esto puede comerse un dígito real. Devuelve cuántos
 * dígitos sacó del principio (para ubicar el cursor).
 */
function stripLeadingPrefixes(digits: string): { rest: string; removed: number } {
  let rest = digits;
  if (rest.startsWith("00")) rest = rest.slice(2);
  if (rest.startsWith("54")) rest = rest.slice(2);
  if (rest.startsWith("9")) rest = rest.slice(1);
  rest = rest.replace(/^0+/, "");
  return { rest, removed: digits.length - rest.length };
}

/**
 * Posición del `15` local a sacar en `national`, o `null`. Solo si el número
 * tiene dígitos de más: con 10 o menos, un `15` después del área es parte
 * del abonado (o todavía no se sabe) y se deja.
 */
function localPrefixAt(national: string): number | null {
  if (national.length <= AR_NATIONAL_LENGTH) return null;
  const area = arAreaCodeLength(national);
  if (area === null) return null;
  return national.slice(area, area + LOCAL_MOBILE_PREFIX.length) === LOCAL_MOBILE_PREFIX
    ? area
    : null;
}

/** Nacional sin prefijos ni `15`, sin recortar. */
function nationalDigits(raw: string): string {
  let { rest: national } = stripLeadingPrefixes(raw.replace(/\D/g, ""));
  const at = localPrefixAt(national);
  if (at !== null) {
    national = national.slice(0, at) + national.slice(at + LOCAL_MOBILE_PREFIX.length);
  }
  return national;
}

/**
 * Valida y normaliza un WhatsApp argentino tal como lo escribe la gente.
 * Nunca tira.
 */
export function parseArWhatsapp(raw: unknown): ArWhatsappResult {
  if (typeof raw !== "string" || raw.replace(/\D/g, "") === "") {
    return { ok: false, error: "empty" };
  }
  const national = nationalDigits(raw);
  if (national === "") return { ok: false, error: "too_short", diff: AR_NATIONAL_LENGTH };

  // Diez dígitos que abren con `15`: es el prefijo local sin característica
  // (`15 2345 6789`), no un área. Mismo criterio que `WhatsappNumber`.
  if (national.startsWith(LOCAL_MOBILE_PREFIX) && national.length <= AR_NATIONAL_LENGTH) {
    return { ok: false, error: "missing_area_code" };
  }

  if (national.length < AR_NATIONAL_LENGTH) {
    // 6 a 8 dígitos que no arrancan con `11`: el largo de un abonado local.
    // Lo que falta es la característica, no "unos dígitos".
    if (national.length >= 6 && national.length <= 8 && !national.startsWith("11")) {
      return { ok: false, error: "missing_area_code" };
    }
    return { ok: false, error: "too_short", diff: AR_NATIONAL_LENGTH - national.length };
  }
  if (national.length > AR_NATIONAL_LENGTH) {
    return { ok: false, error: "too_long", diff: national.length - AR_NATIONAL_LENGTH };
  }

  const areaCodeLength = arAreaCodeLength(national);
  if (areaCodeLength === null) return { ok: false, error: "invalid_area_code" };

  // Todo igual, en el número entero o en los últimos 8 (el abonado de un
  // `11`): `11 1111 1111`, `11 0000 0000`. Nadie tiene ese número.
  if (/^(\d)\1+$/.test(national) || /(\d)\1{7}$/.test(national)) {
    return { ok: false, error: "fake" };
  }

  return { ok: true, national, canonical: `549${national}`, areaCodeLength };
}

/** Forma canónica (`549XXXXXXXXXX`) o `null` si no es un celular argentino válido. */
export function normalizeArWhatsapp(raw: unknown): string | null {
  const result = parseArWhatsapp(raw);
  return result.ok ? result.canonical : null;
}

export function isValidArWhatsapp(raw: unknown): boolean {
  return parseArWhatsapp(raw).ok;
}

/**
 * Agrupa dígitos nacionales (hasta 10) como se escriben en Argentina, sin el
 * `+54`: `11 2345-6789`, `221 456-7890`, `2966 45-6789`. Sirve también a
 * medio escribir (`11 23`, `221 456-7`). El guion va antes de los últimos 4
 * del abonado. Si el área todavía no se sabe, o no es argentina, van los
 * dígitos solos: agrupar mal es peor que no agrupar.
 */
export function groupArNational(national: string): string {
  const area = arAreaCodeLength(national);
  if (area === null || national.length <= area) return national;
  const subscriber = national.slice(area);
  const head = AR_NATIONAL_LENGTH - area - 4;
  const out = `${national.slice(0, area)} ${subscriber.slice(0, head)}`;
  return subscriber.length > head ? `${out}-${subscriber.slice(head)}` : out;
}

/** Lo que se ve en el input para un número completo y válido, o `null`. */
export function formatArWhatsappNational(raw: string): string | null {
  const result = parseArWhatsapp(raw);
  return result.ok ? groupArNational(result.national) : null;
}

export type ArWhatsappInputState = {
  /** Lo que se muestra en el input. */
  readonly value: string;
  /** Dónde queda el cursor en `value`. */
  readonly caret: number;
};

/**
 * Formato mientras se escribe. Recibe lo que quedó en el input después de la
 * edición (`raw`) y dónde quedó el cursor, y devuelve el valor formateado y el
 * cursor reubicado. Pura: el componente solo la cablea.
 *
 * - El cursor se ubica por DÍGITOS: si había N dígitos antes del cursor, queda
 *   después del N-ésimo dígito que sobrevive al formateo. Los separadores no
 *   cuentan, así que editar en el medio no lo manda al final.
 * - Borrar un separador (`-` o espacio) borra el dígito de ese lado, en vez
 *   de que el formato lo vuelva a poner y el cursor quede trabado. Para eso
 *   hace falta `previous` (el valor de antes) y el sentido del borrado.
 * - Tope de 10 dígitos nacionales. Si ya estaba lleno y se insertó en el
 *   medio, la edición no entra (como `maxLength`). Un pegado largo se recorta.
 * - Prefijos redundantes con el `+54` (`+54`, `9`, `0`) se sacan al vuelo, y
 *   el `15` después del área en cuanto sobran dígitos (ver `localPrefixAt`).
 */
export function formatArWhatsappInput(
  raw: string,
  caret: number,
  previous?: { readonly value: string; readonly deletion?: "backward" | "forward" },
): ArWhatsappInputState {
  let digits = raw.replace(/\D/g, "");
  let before = raw.slice(0, Math.max(0, caret)).replace(/\D/g, "").length;

  // Se borró un separador: los dígitos no cambiaron. Se borra el dígito de
  // ese lado del cursor.
  if (previous?.deletion && digits === previous.value.replace(/\D/g, "")) {
    if (previous.deletion === "backward" && before > 0) {
      digits = digits.slice(0, before - 1) + digits.slice(before);
      before -= 1;
    } else if (previous.deletion === "forward" && before < digits.length) {
      digits = digits.slice(0, before) + digits.slice(before + 1);
    }
  }

  // Prefijos del principio: los dígitos sacados que estaban antes del cursor
  // dejan de contar.
  const stripped = stripLeadingPrefixes(digits);
  let national = stripped.rest;
  before = Math.max(0, before - stripped.removed);

  const at = localPrefixAt(national);
  if (at !== null) {
    national = national.slice(0, at) + national.slice(at + LOCAL_MOBILE_PREFIX.length);
    if (before > at) before = Math.max(at, before - LOCAL_MOBILE_PREFIX.length);
  }

  if (national.length > AR_NATIONAL_LENGTH) {
    const previousNational = previous ? nationalDigits(previous.value) : "";
    if (previous && previousNational.length >= AR_NATIONAL_LENGTH && !previous.deletion) {
      // Ya estaba lleno: la inserción no entra. El cursor vuelve a donde
      // estaba (un dígito antes del que se intentó meter).
      const value = groupArNational(previousNational.slice(0, AR_NATIONAL_LENGTH));
      return { value, caret: caretAfterDigits(value, Math.max(0, before - 1)) };
    }
    national = national.slice(0, AR_NATIONAL_LENGTH);
    before = Math.min(before, AR_NATIONAL_LENGTH);
  }

  const value = groupArNational(national);
  return { value, caret: caretAfterDigits(value, before) };
}

/** Índice en `value` justo después de su dígito número `count`. */
function caretAfterDigits(value: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) {
      seen += 1;
      if (seen === count) return index + 1;
    }
  }
  return value.length;
}
