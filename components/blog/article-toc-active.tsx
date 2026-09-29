"use client";

import { useEffect } from "react";

type ArticleTocActiveProps = {
  /** Ids de los `h2` del cuerpo, en orden (los mismos del índice). */
  readonly ids: readonly string[];
};

/**
 * Isla hoja del índice de la nota: marca con `aria-current="location"` el
 * link de la sección que se está leyendo. No renderiza nada: la lista es HTML
 * del server y esto solo le cambia un atributo, así que no hay texto que
 * dependa de hidratar y sin JS el índice funciona igual.
 *
 * La sección activa es el último `h2` que ya pasó por arriba del 30% de la
 * ventana. Se recalcula cuando un `h2` cruza esa línea (IntersectionObserver),
 * no en cada evento de scroll.
 */
export function ArticleTocActive({ ids }: ArticleTocActiveProps) {
  useEffect(() => {
    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    if (headings.length === 0) return;

    const links = new Map(
      ids.map((id) => [id, document.querySelector<HTMLElement>(`[data-toc-link="${id}"]`)]),
    );

    const update = () => {
      const line = window.innerHeight * 0.3;
      let current = headings[0]!.id;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= line) current = heading.id;
      }
      for (const [id, link] of links) {
        if (!link) continue;
        if (id === current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    };

    const observer = new IntersectionObserver(update, { rootMargin: "0px 0px -70% 0px" });
    for (const heading of headings) observer.observe(heading);
    update();

    return () => observer.disconnect();
  }, [ids]);

  return null;
}
