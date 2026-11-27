import { QUOTE_TABS } from "@/lib/analytics/events";
import {
  isValidAge,
  isValidConsultaEmail,
  normalizeConsultaEmail,
  parseAmount,
  postalCodeDigits,
} from "@/lib/consulta-fields";
import { moduloPedidoContent, type ConsultaField } from "@/lib/content/modulo-pedido";
import { whatsappErrorMessage } from "@/lib/content/whatsapp-errors";
import { cuitDigits, isValidCuit } from "@/lib/cuit";
import { parseArWhatsapp } from "@/lib/phone";
import { canonicalPlate } from "@/lib/plate";

/**
 * Consultas de Seguros y Financiación contra el backend
 * (`POST /api/v1/inquiries/insurance` y `/financing`). Solo server: lo usan
 * `app/api/consulta/route.ts` y `ModuloPedido`.
 *
 * Contrato del backend (2026-11-27): público, sin auth, todos los campos
 * requeridos y `forbidNonWhitelisted` (un campo de más da 400). Por eso el
 * body se arma acá campo por campo, a partir de los valores crudos del form,
 * y nunca se reenvía lo que mandó el navegador.
 *
 * `amount` de Financiación (el monto, en pesos enteros de 1 a 999.999.999)
 * es opcional en el DTO del backend, pero la landing lo exige (decisión de
 * producto, 2026-11-27): sin monto la consulta se rechaza acá y no llega al
 * backend, así que la clave viaja siempre.
 */

export const INQUIRY_KINDS = {
  [QUOTE_TABS.seguros]: "insurance",
  [QUOTE_TABS.financiacion]: "financing",
} as const;

export type InquiryTab = keyof typeof INQUIRY_KINDS;
export type InquiryKind = (typeof INQUIRY_KINDS)[InquiryTab];

/** Tope del backend para `contactName`. */
const CONTACT_NAME_MAX = 120;

// ── Ids de las opciones del form → enums del backend ─────────────────────
// Los tipos salen del contenido: si se suma una opción a un select y no se
// mapea acá, TypeScript no compila.

type SegurosField = (typeof moduloPedidoContent.seguros.fields)[number];
type FinanciacionField = (typeof moduloPedidoContent.financiacion.fields)[number];
type OptionId<F, N extends string> =
  Extract<F, { readonly name: N }> extends { readonly options: readonly (infer O)[] }
    ? O extends { readonly id: infer I }
      ? I
      : never
    : never;

type CoberturaId = OptionId<SegurosField, "cobertura">;
type SexoId = OptionId<FinanciacionField, "sexo">;
type MotivoId = OptionId<FinanciacionField, "motivo">;

const COVERAGE: Record<CoberturaId, string> = {
  "responsabilidad-civil": "rc",
  "terceros-completo": "terceros_completo",
  "todo-riesgo": "todo_riesgo",
  asesoramiento: "advice",
};

const SEX: Record<SexoId, string> = {
  femenino: "female",
  masculino: "male",
  x: "x",
};

const REASON: Record<MotivoId, string> = {
  "arreglo-mecanico": "mechanical_repair",
  "chapa-pintura": "body_paint",
  service: "service",
  neumaticos: "tires",
  "bateria-repuestos": "battery_parts",
  patentes: "registration_tax",
  multas: "fines",
  vtv: "vtv",
  transferencia: "transfer",
  seguro: "insurance",
  gnc: "cng",
  otro: "other",
};

function mapped(map: Record<string, string>, raw: string): string | null {
  return Object.hasOwn(map, raw) ? map[raw] : null;
}

// ── Body del backend ─────────────────────────────────────────────────────

type InquiryContact = {
  readonly contactName: string;
  readonly contactPhone: string;
  readonly contactEmail: string;
  readonly consent: true;
};

export type InsuranceInquiryBody = InquiryContact & {
  readonly age: number;
  readonly postalCode: string;
  readonly plate: string;
  readonly coverage: string;
};

export type FinancingInquiryBody = InquiryContact & {
  readonly cuit: string;
  readonly sex: string;
  readonly reason: string;
  /** Pesos enteros. La landing lo manda siempre (el backend lo acepta opcional). */
  readonly amount: number;
};

/**
 * Un error de la consulta, tal como lo recibe el form: el mensaje (en
 * español, del contenido) y, si se le puede atribuir, el campo del form
 * (`name` del contenido, o `consent`) para marcarlo y llevarle el foco.
 */
export type InquiryError = { readonly error: string; readonly field?: string };

/** Clave de la casilla de consentimiento en `InquiryError.field`. */
export const INQUIRY_CONSENT_FIELD = "consent";

export type InquiryParseResult =
  | {
      readonly ok: true;
      readonly tab: InquiryTab;
      readonly kind: "insurance";
      readonly body: InsuranceInquiryBody;
    }
  | {
      readonly ok: true;
      readonly tab: InquiryTab;
      readonly kind: "financing";
      readonly body: FinancingInquiryBody;
    }
  | ({ readonly ok: false } & InquiryError);

/**
 * Lo que manda el form: de qué pestaña, los valores crudos por nombre de
 * campo (los de `moduloPedidoContent`), la casilla de consentimiento y los
 * datos de medición.
 */
export type InquiryRequest = {
  readonly kind: InquiryKind;
  readonly values: Readonly<Record<string, string>>;
  readonly consent: boolean;
  // Solo medición: los consume la route, al backend no llegan. Opcionales y
  // nunca invalidan la consulta.
  /** Dónde está montado el módulo (`modulo_home` / `modulo_pedido`). */
  readonly placement?: string;
  /** `eventID` compartido entre el Pixel y la Conversions API de Meta. */
  readonly metaEventId?: string;
  readonly posthogDistinctId?: string;
  readonly posthogSessionId?: string;
};

const fail = (error: string, field?: string) =>
  ({ ok: false, error, ...(field ? { field } : {}) }) as const;

function fieldsOf(tab: InquiryTab): readonly ConsultaField[] {
  const content = moduloPedidoContent[tab];
  return [...content.fields, ...content.contact];
}

/** Mensaje del campo en el contenido: el mismo que muestra el form. */
function fieldMessage(
  fields: readonly ConsultaField[],
  name: string,
  which: "error" | "invalid",
): string {
  const field = fields.find((candidate) => candidate.name === name);
  const message =
    field && field.kind !== "whatsapp"
      ? which === "invalid" && field.kind === "text"
        ? (field.invalid ?? field.error)
        : field.error
      : undefined;
  return message ?? moduloPedidoContent.consultaErrors.invalid;
}

/**
 * Revalida en el server todo lo que valida el form (mismas reglas: es dato
 * del cliente), normaliza y arma el body EXACTO del contrato.
 */
export function parseInquiry(raw: unknown): InquiryParseResult {
  if (!raw || typeof raw !== "object") return fail(moduloPedidoContent.consultaErrors.invalid);
  const { kind, values: rawValues, consent } = raw as Record<string, unknown>;

  const tab = (Object.keys(INQUIRY_KINDS) as InquiryTab[]).find(
    (candidate) => INQUIRY_KINDS[candidate] === kind,
  );
  if (!tab || !rawValues || typeof rawValues !== "object") {
    return fail(moduloPedidoContent.consultaErrors.invalid);
  }
  const content = moduloPedidoContent[tab];
  const fields = fieldsOf(tab);
  const source = rawValues as Record<string, unknown>;
  const value = (name: string) => {
    const field = source[name];
    return typeof field === "string" ? field.trim() : "";
  };
  const missing = (name: string) => fail(fieldMessage(fields, name, "error"), name);
  const invalid = (name: string) => fail(fieldMessage(fields, name, "invalid"), name);

  // ── Comunes ──
  const contactName = value("nombre");
  if (!contactName) return missing("nombre");
  if (contactName.length > CONTACT_NAME_MAX) {
    return fail(moduloPedidoContent.consultaErrors.nameTooLong, "nombre");
  }

  const phone = parseArWhatsapp(value("whatsapp"));
  if (!phone.ok) return fail(whatsappErrorMessage(phone.error, phone.diff), "whatsapp");

  const contactEmail = normalizeConsultaEmail(value("email"));
  if (!contactEmail) return missing("email");
  if (!isValidConsultaEmail(contactEmail)) return invalid("email");

  if (consent !== true) return fail(content.consent.error, INQUIRY_CONSENT_FIELD);

  const contact: InquiryContact = {
    contactName,
    contactPhone: phone.canonical,
    contactEmail,
    consent: true,
  };

  if (tab === QUOTE_TABS.seguros) {
    const age = value("edad");
    if (!age) return missing("edad");
    if (!isValidAge(age)) return invalid("edad");

    if (!value("codigo-postal")) return missing("codigo-postal");
    const postalCode = postalCodeDigits(value("codigo-postal"));
    if (!postalCode) return invalid("codigo-postal");

    if (!value("patente")) return missing("patente");
    const plate = canonicalPlate(value("patente"));
    if (!plate) return invalid("patente");

    const coverage = mapped(COVERAGE, value("cobertura"));
    if (!coverage) return missing("cobertura");

    return {
      ok: true,
      tab,
      kind: "insurance",
      body: { ...contact, age: Number(age), postalCode, plate, coverage },
    };
  }

  if (!value("cuit")) return missing("cuit");
  if (!isValidCuit(value("cuit"))) return invalid("cuit");

  const sex = mapped(SEX, value("sexo"));
  if (!sex) return missing("sexo");

  const reason = mapped(REASON, value("motivo"));
  if (!reason) return missing("motivo");

  // Monto: requerido. Vacío se rechaza; con valor, tiene que ser válido.
  if (!value("monto")) return missing("monto");
  const amount = parseAmount(value("monto"));
  if (amount === null) return invalid("monto");

  return {
    ok: true,
    tab,
    kind: "financing",
    body: { ...contact, cuit: cuitDigits(value("cuit")), sex, reason, amount },
  };
}

// ── Errores 400 del backend ──────────────────────────────────────────────

/** Campo del body del backend → `name` del campo del form. */
const BACKEND_FIELDS: Record<
  keyof InsuranceInquiryBody | keyof FinancingInquiryBody,
  string
> = {
  contactName: "nombre",
  contactPhone: "whatsapp",
  contactEmail: "email",
  consent: INQUIRY_CONSENT_FIELD,
  age: "edad",
  postalCode: "codigo-postal",
  plate: "patente",
  coverage: "cobertura",
  cuit: "cuit",
  sex: "sexo",
  reason: "motivo",
  amount: "monto",
};

/**
 * Traduce un 400 del backend a un error del form. El `message` del backend
 * está en inglés, es del DTO (`contactEmail must be an email`) y puede traer
 * el valor rechazado: NUNCA se reenvía ni se loguea. Si alguno empieza con
 * el nombre de un campo, se responde con el mensaje de ese campo del
 * contenido; si no, con uno genérico.
 */
export function inquiryRejection(tab: InquiryTab, message: unknown): InquiryError {
  const messages = (Array.isArray(message) ? message : [message]).filter(
    (item): item is string => typeof item === "string",
  );
  for (const text of messages) {
    const first = text.trim().split(/[\s.:]/, 1)[0];
    if (!Object.hasOwn(BACKEND_FIELDS, first)) continue;
    const field = BACKEND_FIELDS[first as keyof typeof BACKEND_FIELDS];
    if (field === INQUIRY_CONSENT_FIELD) {
      return { error: moduloPedidoContent[tab].consent.error, field };
    }
    if (field === "whatsapp") {
      return { error: whatsappErrorMessage("fake"), field };
    }
    return { error: fieldMessage(fieldsOf(tab), field, "invalid"), field };
  }
  return { error: moduloPedidoContent.consultaErrors.rejected };
}
