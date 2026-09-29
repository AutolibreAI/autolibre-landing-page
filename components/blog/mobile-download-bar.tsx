import { ButtonLink } from "@/components/ui/button";

/**
 * Barra fija al pie en mobile. Sólo en el artículo (no en el listado): es la
 * pantalla donde alguien pasa más tiempo leyendo, así que vale la pena un
 * CTA siempre a mano sin que tape contenido en desktop, donde el header ya
 * cumple ese rol.
 */
export function MobileDownloadBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-[6%] py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
      <ButtonLink href="/#descargar" block size="lg">
        Descargar la app gratis
      </ButtonLink>
    </div>
  );
}
