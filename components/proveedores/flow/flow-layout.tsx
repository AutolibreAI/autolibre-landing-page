import { cn } from "@/lib/utils";

type FlowLayoutProps = {
  /** Resumen o contexto del flujo (el plan elegido, qué es el código…). */
  readonly aside?: React.ReactNode;
  /**
   * Dónde va el `aside` en mobile (en desktop siempre va a la derecha).
   * `top`: lo que la persona tiene que ver ANTES de actuar (el plan que está
   * contratando). `bottom`: contexto de ayuda que no debe empujar la acción
   * principal fuera de la primera pantalla (qué es el código de reclamo).
   */
  readonly asideOnMobile?: "top" | "bottom";
  readonly children: React.ReactNode;
};

/**
 * Armazón de los flujos de talleres: el paso en curso y, al costado, lo que
 * lo acompaña. Sin estado: sirve en server y en una isla client.
 *
 * El orden del DOM es el de mobile (y por lo tanto el de lectura y foco):
 * con `top` el `aside` va primero y desde `lg` pasa a la derecha con
 * `flex-row-reverse`; con `bottom` va después y `lg:flex-row` lo deja a la
 * derecha igual. Desde `lg` el `aside` queda pegado (`sticky`) mientras el
 * paso scrollea; `top-24` deja libre el header sticky (4.5rem) con aire.
 */
export function FlowLayout({ aside, asideOnMobile = "top", children }: FlowLayoutProps) {
  const asideNode = aside ? <div className="lg:sticky lg:top-24 lg:w-80 lg:shrink-0">{aside}</div> : null;
  const top = asideOnMobile === "top";

  return (
    <div
      className={cn(
        "flex flex-col gap-8 lg:items-start lg:gap-12",
        top ? "lg:flex-row-reverse" : "lg:flex-row",
      )}
    >
      {top ? asideNode : null}
      <div className="flex min-w-0 flex-1 flex-col gap-8">{children}</div>
      {top ? null : asideNode}
    </div>
  );
}
