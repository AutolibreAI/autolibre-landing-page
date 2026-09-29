import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { ANALYTICS_EVENTS, APP_STORES } from "@/lib/analytics/events";
import { siteContent } from "@/lib/content/site";
import { cn } from "@/lib/utils";

type DownloadCtaProps = Pick<
  VariantProps<typeof buttonVariants>,
  "variant" | "size" | "block"
> & {
  /**
   * Clases del wrapper. Por defecto es `contents` (los links se comportan
   * como hijos directos del padre); para ocultar el CTA por breakpoint se
   * pasa acá, p. ej. `hidden sm:contents`.
   */
  readonly className?: string;
  /** Clases extra para cada uno de los links de tienda. */
  readonly linkClassName?: string;
  /** `placement` de `app_store_clicked`: `header` o `header_menu`. */
  readonly placement?: string;
  readonly onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

/**
 * CTA "Descargar la app" que apunta directo a la tienda de la plataforma.
 *
 * Sólo existe en mobile: en web (o sin JS) no se muestra nada, porque desde
 * una PC no hay app que instalar y la descarga ya vive en el hero de la home.
 *
 * El server manda SIEMPRE los dos links (App Store y Google Play) y el CSS
 * muestra uno solo según el `data-platform` que el script inline del layout
 * pone en `<html>` antes del primer paint. Así el HTML es idéntico para
 * todos (estático, sin cloaking) y no hay nada que hidratar. Los ocultos van
 * con `display: none`, así que salen del árbol de accesibilidad.
 *
 * No lleva `"use client"`: el header lo renderiza en el server y `MobileNav`
 * lo importa como un componente más. El click lo mide el listener delegado
 * de `AnalyticsEvents` (`app_store_clicked`, por los `data-analytics-*`).
 */
export function DownloadCta({
  variant,
  size,
  block,
  className,
  linkClassName,
  placement = "header",
  onClick,
}: DownloadCtaProps) {
  const { cta, downloadTargets } = siteContent.nav;
  const storeClassName = cn(
    buttonVariants({ variant, size, block }),
    linkClassName,
  );

  return (
    <span className={cn("contents", className)}>
      {/*
        Las tiendas son `<a>` nativos con `target`/`rel` como en
        `StoreLinks`: apuntan afuera, el router de `next/link` no aporta nada.
      */}
      <a
        href={downloadTargets.ios.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={downloadTargets.ios.ariaLabel}
        data-analytics-event={ANALYTICS_EVENTS.appStoreClicked}
        data-analytics-store={APP_STORES.appStore}
        data-analytics-placement={placement}
        onClick={onClick}
        className={cn(storeClassName, "hidden platform-ios:inline-flex")}
      >
        {cta.label}
      </a>
      <a
        href={downloadTargets.android.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={downloadTargets.android.ariaLabel}
        data-analytics-event={ANALYTICS_EVENTS.appStoreClicked}
        data-analytics-store={APP_STORES.playStore}
        data-analytics-placement={placement}
        onClick={onClick}
        className={cn(storeClassName, "hidden platform-android:inline-flex")}
      >
        {cta.label}
      </a>
    </span>
  );
}
