import { siteContent } from "@/lib/content/site";
import { cn } from "@/lib/utils";

/**
 * Botón flotante de WhatsApp, abajo a la derecha. Se monta UNA vez en
 * `app/layout.tsx`, así está en todas las páginas. Server Component: es un
 * `<a>` plano, no necesita JS.
 *
 * - Logo oficial relleno (no el ícono de línea del set): es lo que la gente
 *   reconoce de un vistazo, y el trazo fino no se leía a este tamaño.
 * - Se despega de cualquier fondo con `shadow-fab` (dos capas en `ink`) y un
 *   borde blanco que lo recorta sobre secciones verdes u oscuras.
 * - `z-30`: arriba del contenido, debajo del panel del menú mobile (`z-40`),
 *   del header (`z-50`) y de los modales/vistas de pantalla completa. Igual
 *   se oculta mientras el menú mobile está abierto, como la barra del pedido.
 * - Debajo de `lg` se oculta en las páginas con barra fija al pie
 *   (`data-bottom-bar`: artículo del blog, `/pedido`): la barra la taparía y
 *   ya trae el CTA de la página. El WhatsApp sigue en el footer.
 * - El foco visible es el global (`:focus-visible` en `globals.css`).
 */
export function WhatsappFab() {
  const { label, href } = siteContent.whatsappFab;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        // `calc` con `env()`: no hay utility canónica para sumar el área
        // segura del iPhone (mismo patrón que las barras fijas al pie).
        "fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 md:right-[calc(1.5rem+env(safe-area-inset-right))] md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]",
        "flex size-14 items-center justify-center rounded-full border-2 border-surface bg-whatsapp text-surface shadow-fab md:size-16",
        "hover:bg-whatsapp-hover hover:shadow-fab-hover motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-0.5",
        // Variantes arbitrarias: no hay utility para "un ancestro tiene tal
        // descendiente" (mismo recurso que `PedidoStickyBar`).
        "[html:has(#mobile-nav-panel)_&]:invisible max-lg:[html:has([data-bottom-bar])_&]:hidden",
      )}
    >
      <WhatsappLogo className="size-7 md:size-8" />
      <span className="sr-only">
        {label} {siteContent.nav.externalHint}
      </span>
    </a>
  );
}

/** Logo de WhatsApp (glifo oficial relleno), decorativo: el nombre lo da el `sr-only`. */
function WhatsappLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}
