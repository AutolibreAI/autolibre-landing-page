/**
 * Preguntas frecuentes de un perfil, generadas desde sus datos estructurados
 * (`data-model.md §3.5`, FR-024). Módulo PURO: sin imports, solo sintaxis TS
 * borrable, así lo corre `node --test` y se puede portar a la app (que debe
 * pasar la misma fixture, `contracts/fixtures/faq-cases.json`).
 *
 * UNA lista alimenta el acordeón visible y el `FAQPage` de JSON-LD. La función
 * decide QUÉ preguntas existen y con qué datos; el texto de cada una sale de
 * las plantillas, que llegan por parámetro (viven en `lib/content/`). Ningún
 * LLM interviene: el contenido nunca lo decide un modelo.
 *
 * Reglas duras:
 * - Una pregunta se genera SOLO si existe el dato del que depende.
 * - Nunca una pregunta negativa por una marca no declarada.
 * - `fuelTypes.mode = "all"` NO implica GNC (sería afirmar algo que el
 *   proveedor no declaró).
 * - Orden fijo y tope de 8 ítems.
 */

export type FaqItem = {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
};

export type FaqHoursDay = {
  /** ISO: 1 = lunes … 7 = domingo. */
  readonly weekday: number;
  readonly ranges: readonly { readonly opensAt: string; readonly closesAt: string }[];
};

export type FaqProfile = {
  readonly locationMode: "in_person" | "mobile" | "both";
  readonly address: { readonly full: string } | null;
  readonly serviceArea: {
    readonly localities: readonly { readonly name: string }[];
  } | null;
  readonly businessHours: readonly FaqHoursDay[] | null;
  readonly brands:
    | { readonly mode: "all" }
    | { readonly mode: "specific"; readonly items: readonly string[] };
  readonly vehicleTypes: readonly string[];
  readonly fuelTypes:
    | { readonly mode: "all" }
    | { readonly mode: "specific"; readonly items: readonly string[] };
  readonly equipment: readonly { readonly slug: string }[];
  readonly services: readonly {
    readonly items: readonly { readonly slug: string }[];
  }[];
};

export type FaqTemplate = {
  readonly question: string;
  readonly answer: string;
};

export type FaqTemplates = {
  /** Lunes a domingo, en ese orden (índice 0 = lunes). */
  readonly weekdayNames: readonly string[];
  /** Conectores: "y" entre tramos y marcas, "a" entre horas y entre días. */
  readonly and: string;
  readonly to: string;
  /** "de {from} a {to}" ya armado por la función: se pasa el prefijo "de". */
  readonly from: string;
  readonly location: FaqTemplate; // {address}
  readonly hoursWeekly: FaqTemplate; // {hours}
  readonly hoursSaturdayOpen: FaqTemplate; // {ranges}
  readonly hoursSaturdayClosed: FaqTemplate;
  readonly brandsSpecific: FaqTemplate; // {brand} {brands}
  readonly brandsAll: FaqTemplate;
  readonly vehicle: FaqTemplate; // {vehicle}
  /** Etiqueta por tipo de vehículo ("car" → "autos"). Sin etiqueta no hay pregunta. */
  readonly vehicleLabels: Readonly<Record<string, string>>;
  readonly fuelCng: FaqTemplate;
  readonly diagnosticScanner: FaqTemplate;
  readonly mobileService: FaqTemplate; // {localities}
  /** Slugs de equipamiento que cuentan como "escáner". */
  readonly scannerEquipmentSlugs: readonly string[];
  /** Slugs de servicios de diagnóstico que cuentan como "escáner". */
  readonly diagnosticServiceSlugs: readonly string[];
};

export const MAX_FAQ_ITEMS = 8;
const MAX_BRAND_QUESTIONS = 5;
const MAX_VEHICLE_QUESTIONS = 3;

function fill(text: string, values: Readonly<Record<string, string>>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function joinList(items: readonly string[], and: string): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}

/** "08:00" → "8:00". */
function shortTime(time: string): string {
  return time.replace(/^0(\d)/, "$1");
}

function rangesText(
  ranges: FaqHoursDay["ranges"],
  templates: FaqTemplates,
): string {
  return joinList(
    [...ranges]
      .sort((a, b) => a.opensAt.localeCompare(b.opensAt))
      .map(
        (range) =>
          `${templates.from} ${shortTime(range.opensAt)} ${templates.to} ${shortTime(
            range.closesAt === "24:00" ? "00:00" : range.closesAt,
          )}`,
      ),
    templates.and,
  );
}

/** Horario semanal en una frase: días consecutivos con el mismo horario se agrupan. */
function weeklyText(
  days: readonly FaqHoursDay[],
  templates: FaqTemplates,
): string {
  const open = [...days]
    .filter((day) => day.ranges.length > 0)
    .sort((a, b) => a.weekday - b.weekday);
  const groups: { first: number; last: number; text: string }[] = [];
  for (const day of open) {
    const text = rangesText(day.ranges, templates);
    const previous = groups[groups.length - 1];
    if (previous && previous.text === text && previous.last === day.weekday - 1) {
      previous.last = day.weekday;
    } else {
      groups.push({ first: day.weekday, last: day.weekday, text });
    }
  }
  return groups
    .map((group) => {
      const name = (weekday: number) => templates.weekdayNames[weekday - 1] ?? "";
      const label =
        group.first === group.last
          ? name(group.first)
          : `${name(group.first)} ${templates.to} ${name(group.last)}`;
      return `${label} ${group.text}`;
    })
    .join("; ");
}

export function buildFaq(
  profile: FaqProfile,
  templates: FaqTemplates,
): readonly FaqItem[] {
  const items: FaqItem[] = [];
  const add = (id: string, template: FaqTemplate, values: Record<string, string> = {}) => {
    items.push({
      id,
      question: fill(template.question, values),
      answer: fill(template.answer, values),
    });
  };

  const address = profile.address?.full.trim() ?? "";
  if (address) add("location", templates.location, { address });

  const hours = profile.businessHours ?? [];
  const hasHours = hours.some((day) => day.ranges.length > 0);
  if (hasHours) {
    add("hours-weekly", templates.hoursWeekly, { hours: weeklyText(hours, templates) });
    const saturday = hours.find((day) => day.weekday === 6);
    if (saturday && saturday.ranges.length > 0) {
      add("hours-saturday", templates.hoursSaturdayOpen, {
        ranges: rangesText(saturday.ranges, templates),
      });
    } else {
      add("hours-saturday", templates.hoursSaturdayClosed);
    }
  }

  const hasServices = profile.services.some((group) => group.items.length > 0);
  if (profile.brands.mode === "specific") {
    const all = profile.brands.items;
    const list = joinList(all, templates.and);
    for (const brand of all.slice(0, MAX_BRAND_QUESTIONS)) {
      add(`brands-${slugify(brand)}`, templates.brandsSpecific, { brand, brands: list });
    }
  } else if (hasServices) {
    add("brands-all", templates.brandsAll);
  }

  let vehicleQuestions = 0;
  for (const type of profile.vehicleTypes) {
    if (vehicleQuestions >= MAX_VEHICLE_QUESTIONS) break;
    const label = templates.vehicleLabels[type];
    if (!label) continue;
    add(`vehicle-${type}`, templates.vehicle, { vehicle: label });
    vehicleQuestions += 1;
  }

  if (profile.fuelTypes.mode === "specific" && profile.fuelTypes.items.includes("cng")) {
    add("fuel-cng", templates.fuelCng);
  }

  const hasScanner =
    profile.equipment.some((item) => templates.scannerEquipmentSlugs.includes(item.slug)) ||
    profile.services.some((group) =>
      group.items.some((item) => templates.diagnosticServiceSlugs.includes(item.slug)),
    );
  if (hasScanner) add("diagnostic-scanner", templates.diagnosticScanner);

  const localities = (profile.serviceArea?.localities ?? []).map((l) => l.name);
  if (
    (profile.locationMode === "mobile" || profile.locationMode === "both") &&
    localities.length > 0
  ) {
    add("mobile-service", templates.mobileService, {
      localities: joinList(localities, templates.and),
    });
  }

  return items.slice(0, MAX_FAQ_ITEMS);
}
