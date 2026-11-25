import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { cn } from "@/lib/utils";

/**
 * Encabezado compacto de las vistas de `/cuenta` sin negocio (cliente,
 * onboarding de proveedor y la pregunta de la cuenta nueva): `<h1>` y una
 * bajada, sin rótulo arriba. Es una superficie para operar, no una portada:
 * el título va a tamaño de titular y deja lugar al contenido.
 *
 * `tabIndex={-1}`: después de elegir "cliente / taller" el foco viene acá.
 */
export function AccountHead({
  title,
  intro,
  className,
}: {
  readonly title: string;
  readonly intro: string;
  readonly className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <h1
        id={PRIVATE_FLOW_TITLE_ID}
        tabIndex={-1}
        className="font-display text-2xl leading-tight font-bold tracking-tight text-balance text-fg md:text-3xl"
      >
        {title}
      </h1>
      <p className="max-w-160 text-fg-muted">{intro}</p>
    </div>
  );
}
