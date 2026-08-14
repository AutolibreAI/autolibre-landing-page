"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { faqCategories } from "@/lib/content/faq";
import { homeContent } from "@/lib/content/home";
import { cn } from "@/lib/utils";

/**
 * FAQ con pestañas por categoría.
 *
 * Dos decisiones deliberadas:
 *
 * 1. Las categorías inactivas se ocultan con el atributo `hidden`, no se
 *    desmontan. Todas las respuestas quedan en el HTML servido, así que el
 *    crawler las lee aunque nunca ejecute el click.
 * 2. El acordeón es `<details>/<summary>` nativo: accesible por teclado,
 *    expandible sin JavaScript y sin estado que sincronizar.
 */
export function FaqSection() {
  const [activeId, setActiveId] = useState(faqCategories[0].id);

  return (
    <Section id="faq" tone="surface" aria-labelledby="faq-title">
      <Container size="prose">
        <h2
          id="faq-title"
          className="mb-12 text-center font-display text-[2rem] font-bold text-ink md:text-[2.25rem]"
        >
          {homeContent.faq.title}
        </h2>

        <div
          role="tablist"
          aria-label="Categorías de preguntas frecuentes"
          className="mb-10 flex flex-wrap justify-center gap-2.5"
        >
          {faqCategories.map((category) => {
            const isActive = category.id === activeId;
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                id={`faq-tab-${category.id}`}
                aria-selected={isActive}
                aria-controls={`faq-panel-${category.id}`}
                onClick={() => setActiveId(category.id)}
                className={cn(
                  "cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-brand text-white"
                    : "bg-surface-muted text-ink hover:bg-surface-muted/70",
                )}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {faqCategories.map((category) => (
          <div
            key={category.id}
            role="tabpanel"
            id={`faq-panel-${category.id}`}
            aria-labelledby={`faq-tab-${category.id}`}
            hidden={category.id !== activeId}
            /* Flujo de bloque a propósito: una clase `flex` pisaría el
               `display:none` que aporta el atributo `hidden`. */
            className="space-y-2.5"
          >
            {category.items.map((item) => (
              <details
                key={item.id}
                name={`faq-${category.id}`}
                className="group overflow-hidden rounded-[0.875rem] border border-line"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-display text-base font-semibold text-ink">
                  <span>{item.question}</span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-xl leading-none text-ink/60 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="px-6 pb-5.5 text-[0.9375rem] leading-relaxed text-ink/72">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        ))}
      </Container>
    </Section>
  );
}
