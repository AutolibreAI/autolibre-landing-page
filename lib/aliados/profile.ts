import type { PartnerDetail, ServiceCatalogCategory } from "@/lib/autolibre-api";
import { aliadoPerfilContent } from "@/lib/content/aliado-perfil";

/**
 * Armado del perfil a partir de los datos crudos: qué familias y rubros se
 * muestran y qué preguntas frecuentes se pueden contestar con campos reales.
 * Funciones puras: la página las usa para el HTML y para el JSON-LD, así lo
 * visible y lo estructurado no divergen.
 */

/** Familias del negocio, en el orden del catálogo; las desconocidas no van. */
export function partnerFamilies(
  partner: PartnerDetail,
  catalog: readonly ServiceCatalogCategory[],
): { slug: string; name: string }[] {
  const own = new Set(partner.categories);
  return catalog
    .filter((family) => own.has(family.slug))
    .map(({ slug, name }) => ({ slug, name }));
}

/**
 * Rubros del negocio agrupados por familia, ambos en el orden del catálogo.
 * Un slug de rubro que el catálogo no conoce se saltea (no hay nombre que
 * mostrar). Sin catálogo, no hay grupos.
 */
export function partnerServiceGroups(
  partner: PartnerDetail,
  catalog: readonly ServiceCatalogCategory[],
) {
  const own = new Set(partner.services);
  return catalog
    .map((family) => ({
      familySlug: family.slug,
      familyName: family.name,
      services: family.services.filter((service) => own.has(service.slug)).map((s) => s.name),
    }))
    .filter((group) => group.services.length > 0);
}

/**
 * Preguntas frecuentes del perfil, SOLO con datos reales del negocio: marcas
 * (si declaró), horarios (si los hay), GNC (si lo atiende explícitamente) y,
 * siempre, cómo pedirle presupuesto. Con menos de dos preguntas no hay
 * sección (ni `FAQPage`): una sola pregunta genérica no es una FAQ.
 */
export function partnerFaqs(partner: PartnerDetail): { question: string; answer: string }[] {
  const { faq } = aliadoPerfilContent;
  const items: { question: string; answer: string }[] = [];

  if (partner.brands.length > 0) {
    items.push({
      question: faq.brands.question(partner.name, partner.brands[0]),
      answer: faq.brands.answer(partner.name, partner.brands),
    });
  }
  if (partner.hours) {
    items.push({ question: faq.hours.question, answer: partner.hours });
  }
  if (partner.fuelTypes.includes("cng")) {
    items.push({ question: faq.gnc.question, answer: faq.gnc.answer(partner.name) });
  }
  items.push({ question: faq.quote.question(partner.name), answer: faq.quote.answer(partner.name) });

  return items.length >= 2 ? items : [];
}
