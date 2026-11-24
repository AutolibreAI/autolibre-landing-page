import { ButtonLink } from "@/components/ui/button";
import { blogContent } from "@/lib/content/blog";

/**
 * Barra fija inferior en celular del blog (listado, categorías y nota):
 * "Descargar la app gratis", como en el lienzo (`Blog`, `BlogNota`). No es
 * la `MobileActionBar` del resto del sitio: el diseño del blog la mantiene
 * como descarga, y el pedido va en el llamado de cada nota.
 *
 * Misma mecánica que `MobileActionBar`: va DESPUÉS del footer y es `sticky
 * bottom-0`, así nunca tapa el footer ni el último contenido (sin espacio de
 * reserva). Lleva a `/descarga`, la página que resuelve la tienda según el
 * teléfono. `data-bottom-bar` esconde el botón flotante de WhatsApp en
 * celular (ver `WhatsappFab`).
 */
export function MobileDownloadBar() {
  const { label, cta, href } = blogContent.mobileBar;

  return (
    <aside
      aria-label={label}
      data-bottom-bar
      // `calc` con `env()`: no hay utility canónica para sumar el área segura.
      // `px-[6%]`: el gutter de `Container`, alineado con el header y el footer.
      className="sticky bottom-0 z-40 border-t border-control-line bg-card px-[6%] pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:hidden"
    >
      <ButtonLink href={href} variant="primary" size="52" block>
        {cta}
      </ButtonLink>
    </aside>
  );
}
