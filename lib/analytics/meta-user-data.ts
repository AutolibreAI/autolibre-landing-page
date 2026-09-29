import "server-only";
import { createHash } from "node:crypto";
import { normalizeArWhatsapp } from "@/lib/phone";

/**
 * `user_data.ph` de la Conversions API: el WhatsApp del pedido, normalizado
 * como pide Meta (sólo dígitos, con código de país, sin `+` ni ceros
 * adelante) y hasheado con SHA-256. El número crudo nunca sale del server ni
 * se loguea: a Meta sólo le llega el hash.
 *
 * La normalización es la de `lib/phone.ts` (la misma que valida el form y
 * `/api/presupuesto`): `549` + número nacional de 10 dígitos, sin `0` ni
 * `15`. Lo que no se puede normalizar con confianza (sin característica,
 * dígitos de más o de menos) se omite: omitir `ph` es mejor que mandar un
 * hash de un número mal armado. El `Lead` sale igual, sólo sin ese dato.
 *
 * Por qué dos variantes: no sabemos si Meta tiene guardado el celular de la
 * cuenta con el `9` de móvil (`549…`, el E.164 correcto) o sin él (`54…`,
 * como lo carga mucha gente).
 * `ph` acepta varios hashes, así que se mandan los dos: si el número de la
 * cuenta coincide con cualquiera, matchea. Ambos salen del mismo número
 * nacional validado, así que no se agrega ruido.
 */

/**
 * Devuelve el número en formato E.164 sin `+` (`549XXXXXXXXXX`) o `null` si
 * no se puede armar uno confiable. Pura: sin hash, para poder probarla.
 * Re-exportada desde `lib/phone.ts` para no romper a quien la importa acá.
 */
export { normalizeArWhatsapp };

/**
 * Las dos formas en que Meta puede tener guardado el mismo celular AR: con el
 * `9` de móvil (`549XXXXXXXXXX`) y sin él (`54XXXXXXXXXX`). `[]` si el número
 * no se pudo normalizar. Pura: sin hash, para poder probarla.
 */
export function arWhatsappVariants(raw: string): string[] {
  const normalized = normalizeArWhatsapp(raw);
  if (!normalized) return [];
  const national = normalized.slice("549".length);
  return [`549${national}`, `54${national}`];
}

/**
 * `ph` listo para `user_data`: SHA-256 en hex de cada variante del número.
 * `[]` si el valor no es un string o no se pudo normalizar.
 */
export function hashedWhatsappVariantsForMeta(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return arWhatsappVariants(raw).map((variant) =>
    createHash("sha256").update(variant).digest("hex"),
  );
}
