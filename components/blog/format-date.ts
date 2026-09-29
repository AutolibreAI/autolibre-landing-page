const formatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  // Hygraph guarda `date` como `YYYY-MM-DD` sin hora. `new Date("2026-09-23")`
  // se interpreta en UTC: formateado en la zona local de Argentina (UTC-3)
  // mostraría el día anterior. Fijar UTC acá lo evita.
  timeZone: "UTC",
});

/** `2026-09-23` → `23 de septiembre de 2026`. Devuelve "" si la fecha no es válida. */
export function formatPostDate(date: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "" : formatter.format(parsed);
}
